import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetSubcategories = withPermission(
	[Permission.ViewStore],
	async (req, context) => {
		try {
			const { id: categoryIdParam } = await context.params;
			const categoryId = parseInt(categoryIdParam, 10);

			if (Number.isNaN(categoryId)) {
				return NextResponse.json(
					{ error: "Invalid category ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Verify category exists
			const { data: category, error: catError } = await supabase
				.from("store_categories")
				.select("id")
				.eq("id", categoryId)
				.single();

			if (catError || !category) {
				return NextResponse.json(
					{ error: "Category not found" },
					{ status: 404 }
				);
			}

			const { data: subcategories, error } = await supabase
				.from("store_subcategories")
				.select("*")
				.eq("category_id", categoryId)
				.order("id");

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch subcategories" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: subcategories,
				meta: { total: subcategories?.length ?? 0 },
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

const handleCreateSubcategory = withPermission(
	[Permission.CreateStoreItems],
	async (req, context) => {
		try {
			const { id: categoryIdParam } = await context.params;
			const categoryId = parseInt(categoryIdParam, 10);

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

			// Verify category exists
			const { data: category, error: catError } = await supabase
				.from("store_categories")
				.select("id")
				.eq("id", categoryId)
				.single();

			if (catError || !category) {
				return NextResponse.json(
					{ error: "Category not found" },
					{ status: 404 }
				);
			}

			const { data: subcategory, error } = await supabase
				.from("store_subcategories")
				.insert({
					category_id: categoryId,
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
				})
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
					{ error: "Failed to create subcategory" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{
					data: subcategory,
					message: "Subcategory created successfully",
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

export const GET = handleGetSubcategories;
export const POST = handleCreateSubcategory;
