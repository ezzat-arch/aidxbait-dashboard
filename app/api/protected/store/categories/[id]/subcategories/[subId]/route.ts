import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetSubcategory = withPermission(
	[Permission.ViewStore],
	async (req, context) => {
		try {
			const { id: categoryIdParam, subId } = context.params;
			const categoryId = parseInt(categoryIdParam, 10);
			const subcategoryId = parseInt(subId, 10);

			if (Number.isNaN(categoryId) || Number.isNaN(subcategoryId)) {
				return NextResponse.json(
					{ error: "Invalid category or subcategory ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			const { data: subcategory, error } = await supabase
				.from("store_subcategories")
				.select("*")
				.eq("id", subcategoryId)
				.eq("category_id", categoryId)
				.single();

			if (error || !subcategory) {
				return NextResponse.json(
					{ error: "Subcategory not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json({ data: subcategory });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateSubcategory = withPermission(
	[Permission.UpdateStoreItems],
	async (req, context) => {
		try {
			const { id: categoryIdParam, subId } = context.params;
			const categoryId = parseInt(categoryIdParam, 10);
			const subcategoryId = parseInt(subId, 10);

			if (Number.isNaN(categoryId) || Number.isNaN(subcategoryId)) {
				return NextResponse.json(
					{ error: "Invalid category or subcategory ID" },
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

			const { data: subcategory, error } = await supabase
				.from("store_subcategories")
				.update({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", subcategoryId)
				.eq("category_id", categoryId)
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);
				if (error.code === "23505") {
					return NextResponse.json(
						{
							error:
								"A subcategory with this name already exists in this category",
						},
						{ status: 409 }
					);
				}
				return NextResponse.json(
					{ error: "Failed to update subcategory" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: subcategory,
				message: "Subcategory updated successfully",
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

const handleDeleteSubcategory = withPermission(
	[Permission.DeleteStoreItems],
	async (req, context) => {
		try {
			const { id: categoryIdParam, subId } = context.params;
			const categoryId = parseInt(categoryIdParam, 10);
			const subcategoryId = parseInt(subId, 10);

			if (Number.isNaN(categoryId) || Number.isNaN(subcategoryId)) {
				return NextResponse.json(
					{ error: "Invalid category or subcategory ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Check if subcategory is used by products
			const { data: products, error: productsError } = await supabase
				.from("products")
				.select("id")
				.eq("subcategory_id", subcategoryId)
				.limit(1);

			if (productsError) {
				console.error("Database error checking products:", productsError);
				return NextResponse.json(
					{ error: "Failed to check subcategory usage" },
					{ status: 500 }
				);
			}

			if (products && products.length > 0) {
				return NextResponse.json(
					{
						error:
							"Cannot delete subcategory that is linked to products. Remove or reassign products first.",
					},
					{ status: 400 }
				);
			}

			const { error } = await supabase
				.from("store_subcategories")
				.delete()
				.eq("id", subcategoryId)
				.eq("category_id", categoryId);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete subcategory" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Subcategory deleted successfully",
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

export const GET = handleGetSubcategory;
export const PUT = handleUpdateSubcategory;
export const DELETE = handleDeleteSubcategory;
