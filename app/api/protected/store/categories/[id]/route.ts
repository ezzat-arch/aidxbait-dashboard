import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetCategory = withPermission(
	[Permission.ViewStore],
	async (req, context) => {
		try {
			const { id } = await context.params;
			const categoryId = parseInt(id, 10);

			if (Number.isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			const { data: category, error } = await supabase
				.from("store_categories")
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
	async (req, context) => {
		try {
			const { id } = await context.params;
			const categoryId = parseInt(id, 10);

			if (Number.isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();
			const body = await req.json();

			if (!body.name || typeof body.name !== "string") {
				return NextResponse.json(
					{ error: "Name is required and must be a string" },
					{ status: 400 }
				);
			}

			if (!body.name_ar || typeof body.name_ar !== "string") {
				return NextResponse.json(
					{ error: "Arabic name (name_ar) is required and must be a string" },
					{ status: 400 }
				);
			}

			const { data: category, error } = await supabase
				.from("store_categories")
				.update({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", categoryId)
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);
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
	async (req, context) => {
		try {
			const { id } = await context.params;
			const categoryId = parseInt(id, 10);

			if (Number.isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			const { data: products } = await supabase
				.from("products")
				.select("id")
				.eq("category_id", categoryId)
				.limit(1);

			if (products && products.length > 0) {
				return NextResponse.json(
					{
						error:
							"Cannot delete category that is linked to products. Remove or reassign products first.",
					},
					{ status: 400 }
				);
			}

			const { data: subcategories } = await supabase
				.from("store_subcategories")
				.select("id")
				.eq("category_id", categoryId)
				.limit(1);

			if (subcategories && subcategories.length > 0) {
				return NextResponse.json(
					{
						error:
							"Cannot delete category that has subcategories. Remove subcategories first.",
					},
					{ status: 400 }
				);
			}

			const { error } = await supabase
				.from("store_categories")
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
