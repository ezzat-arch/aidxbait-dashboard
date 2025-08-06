import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetProduct = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const { id } = context.params;
			const productId = parseInt(id);

			if (isNaN(productId)) {
				return NextResponse.json(
					{ error: "Invalid product ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Fetch product with all relationships
			const { data: product, error } = await supabase
				.from("products")
				.select(
					`
					*,
					product_images(*),
					product_joints(joint_id, product_joint_names(id, name, name_ar))
				`
				)
				.eq("id", productId)
				.eq("soft_deleted", false)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Product not found" },
					{ status: 404 }
				);
			}

			// Get review aggregations
			const { data: reviewStats } = await supabase
				.from("product_reviews")
				.select("rating")
				.eq("product_id", productId)
				.eq("soft_deleted", false);

			const reviewCount = reviewStats?.length || 0;
			const averageRating =
				reviewCount > 0 && reviewStats
					? reviewStats.reduce((sum, review) => sum + review.rating, 0) /
					  reviewCount
					: 0;

			const productWithDetails = {
				...product,
				review_count: reviewCount,
				average_rating: Math.round(averageRating * 10) / 10,
				joints:
					product.product_joints?.map((pj: any) => pj.product_joint_names) ||
					[],
			};

			return NextResponse.json({ data: productWithDetails });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateProduct = withPermission(
	[Permission.UpdateStoreItems],
	async (req, context, user) => {
		try {
			const { id } = context.params;
			const productId = parseInt(id);

			if (isNaN(productId)) {
				return NextResponse.json(
					{ error: "Invalid product ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();
			const body = await req.json();

			// Basic validation
			if (!body.name || !body.name_ar || !body.price) {
				return NextResponse.json(
					{ error: "Name (EN & AR) and price are required" },
					{ status: 400 }
				);
			}

			// Update product
			const { data: product, error } = await supabase
				.from("products")
				.update({
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
					updated_at: new Date().toISOString(),
				})
				.eq("id", productId)
				.eq("soft_deleted", false)
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
					{ error: "Product not found or failed to update" },
					{ status: 404 }
				);
			}

			// Update product images if provided
			if (body.images !== undefined) {
				// Delete existing images
				await supabase
					.from("product_images")
					.delete()
					.eq("product_id", productId);

				// Insert new images
				if (body.images.length > 0) {
					const imageInserts = body.images.map((img: any) => ({
						product_id: productId,
						image_url: img.url,
						is_main: img.is_main || false,
					}));

					const { error: imageError } = await supabase
						.from("product_images")
						.insert(imageInserts);

					if (imageError) {
						console.error("Image update error:", imageError);
					}
				}
			}

			// Update product-joint relationships if provided
			if (body.joint_ids !== undefined) {
				// Delete existing relationships
				await supabase
					.from("product_joints")
					.delete()
					.eq("product_id", productId);

				// Insert new relationships
				if (body.joint_ids.length > 0) {
					const jointInserts = body.joint_ids.map((jointId: number) => ({
						product_id: productId,
						joint_id: jointId,
					}));

					const { error: jointError } = await supabase
						.from("product_joints")
						.insert(jointInserts);

					if (jointError) {
						console.error("Joint relationship update error:", jointError);
					}
				}
			}

			return NextResponse.json({
				data: product,
				message: "Product updated successfully",
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

const handleDeleteProduct = withPermission(
	[Permission.DeleteStoreItems],
	async (req, context, user) => {
		try {
			const { id } = context.params;
			const productId = parseInt(id);

			if (isNaN(productId)) {
				return NextResponse.json(
					{ error: "Invalid product ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Soft delete product
			const { data: product, error } = await supabase
				.from("products")
				.update({
					soft_deleted: true,
					updated_at: new Date().toISOString(),
				})
				.eq("id", productId)
				.eq("soft_deleted", false)
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Product not found or already deleted" },
					{ status: 404 }
				);
			}

			return NextResponse.json({
				message: "Product deleted successfully",
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

export const GET = handleGetProduct;
export const PUT = handleUpdateProduct;
export const DELETE = handleDeleteProduct;
