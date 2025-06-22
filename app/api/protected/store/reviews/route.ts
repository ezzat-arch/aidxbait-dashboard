import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetReviews = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			// Fetch reviews (excluding soft deleted)
			const { data: reviews, error } = await supabase
				.from("product_reviews")
				.select("*")
				.eq("soft_deleted", false)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch reviews" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: reviews || [],
				meta: { total: reviews?.length || 0 },
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

export const GET = handleGetReviews;
