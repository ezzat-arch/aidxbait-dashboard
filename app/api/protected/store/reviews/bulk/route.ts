import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleCreateBulkReviews = withPermission(
	[Permission.CreateStoreItems],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const body = await req.json();

			// Validate required fields
			if (!body.product_id || !body.count || !body.rating) {
				return NextResponse.json(
					{ error: "product_id, count, and rating are required" },
					{ status: 400 }
				);
			}

			const productId = parseInt(body.product_id);
			const count = parseInt(body.count);
			const rating = parseFloat(body.rating);

			if (isNaN(productId) || isNaN(count) || isNaN(rating)) {
				return NextResponse.json(
					{ error: "Invalid product_id, count, or rating" },
					{ status: 400 }
				);
			}

			if (count <= 0 || count > 1000) {
				return NextResponse.json(
					{ error: "Count must be between 1 and 1000" },
					{ status: 400 }
				);
			}

			if (rating < 1 || rating > 5) {
				return NextResponse.json(
					{ error: "Rating must be between 1 and 5" },
					{ status: 400 }
				);
			}

			// Check if product exists
			const { data: product, error: productError } = await supabase
				.from("products")
				.select("id")
				.eq("id", productId)
				.eq("soft_deleted", false)
				.single();

			if (productError || !product) {
				return NextResponse.json(
					{ error: "Product not found" },
					{ status: 404 }
				);
			}

			// For simplicity, we'll use a dummy patient_id (1) for bulk reviews
			// In a real implementation, you might want to create dummy patients or use existing ones
			const reviews = Array.from({ length: count }, (_, index) => ({
				product_id: productId,
				patient_id: 1, // Dummy patient ID - would need to handle this properly
				rating: rating,
				comment: null, // Bulk reviews don't have comments as specified
				soft_deleted: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}));

			// Insert bulk reviews
			const { data: insertedReviews, error } = await supabase
				.from("product_reviews")
				.insert(reviews)
				.select();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to create bulk reviews" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{
					data: insertedReviews,
					message: `${count} reviews created successfully with ${rating} star rating`,
					meta: { count: insertedReviews?.length || 0 },
				},
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

export const POST = handleCreateBulkReviews;
