import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetCategories = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			// Fetch categories (exclude soft deleted)
			const { data: categories, error } = await supabase
				.from("categories")
				.select("*")
				.order("name");

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch categories" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: categories,
				meta: { total: categories.length },
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

const handleCreateCategory = withPermission(
	[Permission.CreateStoreItems],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const body = await req.json();

			// Validate required fields
			if (!body.name || typeof body.name !== "string") {
				return NextResponse.json(
					{ error: "Name is required and must be a string" },
					{ status: 400 }
				);
			}

			// Create category
			const { data: category, error } = await supabase
				.from("categories")
				.insert({
					name: body.name.trim(),
					description: body.description?.trim() || null,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				// Handle unique constraint violations
				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A category with this name already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create category" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: category, message: "Category created successfully" },
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

export const GET = handleGetCategories;
export const POST = handleCreateCategory;
