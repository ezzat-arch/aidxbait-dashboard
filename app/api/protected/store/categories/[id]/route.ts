import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetCategory = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const { id } = context.params;
			const categoryId = parseInt(id);

			if (isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Fetch category
			const { data: category, error } = await supabase
				.from("categories")
				.select("*")
				.eq("id", categoryId)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Category not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json({ data: category });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateCategory = withPermission(
	[Permission.UpdateStoreItems],
	async (req, context, user) => {
		try {
			const { id } = context.params;
			const categoryId = parseInt(id);

			if (isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();
			const body = await req.json();

			// Validate at least one field is provided
			if (!body.name && !body.description) {
				return NextResponse.json(
					{ error: "At least one field (name or description) is required" },
					{ status: 400 }
				);
			}

			const updateData: any = {
				updated_at: new Date().toISOString(),
			};

			if (body.name) {
				updateData.name = body.name.trim();
			}
			if (body.description !== undefined) {
				updateData.description = body.description?.trim() || null;
			}

			// Update category
			const { data: category, error } = await supabase
				.from("categories")
				.update(updateData)
				.eq("id", categoryId)
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
					{ error: "Failed to update category" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: category,
				message: "Category updated successfully",
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

const handleDeleteCategory = withPermission(
	[Permission.DeleteStoreItems],
	async (req, context, user) => {
		try {
			const { id } = context.params;
			const categoryId = parseInt(id);

			if (isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Check if category has products
			const { data: products, error: productsError } = await supabase
				.from("products")
				.select("id")
				.eq("category_id", categoryId)
				.eq("soft_deleted", false);

			if (productsError) {
				console.error("Database error checking products:", productsError);
				return NextResponse.json(
					{ error: "Failed to check category usage" },
					{ status: 500 }
				);
			}

			if (products && products.length > 0) {
				return NextResponse.json(
					{ error: "Cannot delete category with existing products" },
					{ status: 400 }
				);
			}

			// Delete category (hard delete since categories don't have soft_deleted field)
			const { error } = await supabase
				.from("categories")
				.delete()
				.eq("id", categoryId);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete category" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Category deleted successfully",
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

export const GET = handleGetCategory;
export const PUT = handleUpdateCategory;
export const DELETE = handleDeleteCategory;
