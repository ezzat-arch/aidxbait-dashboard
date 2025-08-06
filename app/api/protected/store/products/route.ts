import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetProducts = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			// Fetch products with all related data
			const { data: products, error } = await supabase
				.from("products")
				.select("*")
				.eq("soft_deleted", false)
				.order("created_at", { ascending: false });

			if (products && products.length > 0) {
				// Get images and joints for each product
				for (let product of products) {
					const { data: images } = await supabase
						.from("product_images")
						.select("*")
						.eq("product_id", product.id);

					const { data: joints } = await supabase
						.from("product_joints")
						.select("joint_id, product_joint_names(id, name, name_ar)")
						.eq("product_id", product.id);

					product.product_images = images || [];
					product.product_joints = joints || [];
				}
			}

			console.log("Products query result:", {
				products: products,
				error: error,
				count: products?.length,
			});

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch products" },
					{ status: 500 }
				);
			}

			// Get review aggregations for each product
			const productsWithReviews = await Promise.all(
				(products || []).map(async (product) => {
					const { data: reviewStats } = await supabase
						.from("product_reviews")
						.select("rating")
						.eq("product_id", product.id)
						.eq("soft_deleted", false);

					const reviewCount = reviewStats?.length || 0;
					const averageRating =
						reviewCount > 0 && reviewStats
							? reviewStats.reduce((sum, review) => sum + review.rating, 0) /
							  reviewCount
							: 0;

					return {
						...product,
						review_count: reviewCount,
						average_rating: Math.round(averageRating * 10) / 10,
						joints:
							product.product_joints?.map(
								(pj: any) => pj.product_joint_names
							) || [],
					};
				})
			);

			return NextResponse.json({
				data: productsWithReviews,
				meta: { total: productsWithReviews.length },
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleCreateProduct = withPermission(
	[Permission.CreateStoreItems],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const body = await req.json();

			// Basic validation
			if (!body.name || !body.name_ar || !body.price) {
				return NextResponse.json(
					{ error: "Name (EN & AR) and price are required" },
					{ status: 400 }
				);
			}

			// Create product in a transaction
			const { data: product, error } = await supabase
				.from("products")
				.insert({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
					description: body.description?.trim() || null,
					description_ar: body.description_ar?.trim() || null,
					price: parseFloat(body.price),
					discounted_price: body.discounted_price
						? parseFloat(body.discounted_price)
						: null,
					currency: body.currency || "EGP",
					stock: parseInt(body.stock) || 0,
					is_best_seller: body.is_best_seller || false,
					is_featured: body.is_featured || false,
					is_available: body.is_available !== false,
					is_oos: body.is_oos || false,
					is_for_rent: body.is_for_rent || false,
					rent_term: body.rent_term || null,
					tags: body.tags || [],
					soft_deleted: false,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A product with this name already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create product" },
					{ status: 500 }
				);
			}

			// Add product images if provided
			if (body.images && body.images.length > 0) {
				const imageInserts = body.images.map((img: any) => ({
					product_id: product.id,
					image_url: img.url,
					is_main: img.is_main || false,
				}));

				const { error: imageError } = await supabase
					.from("product_images")
					.insert(imageInserts);

				if (imageError) {
					console.error("Image insert error:", imageError);
				}
			}

			// Add product-joint relationships if provided
			if (body.joint_ids && body.joint_ids.length > 0) {
				const jointInserts = body.joint_ids.map((jointId: number) => ({
					product_id: product.id,
					joint_id: jointId,
				}));

				const { error: jointError } = await supabase
					.from("product_joints")
					.insert(jointInserts);

				if (jointError) {
					console.error("Joint relationship error:", jointError);
				}
			}

			return NextResponse.json(
				{ data: product, message: "Product created successfully" },
				{ status: 201 }
			);
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

export const GET = handleGetProducts;
export const POST = handleCreateProduct;
