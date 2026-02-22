import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetCategories = withPermission(
	[Permission.ViewStore],
	async () => {
		try {
			const supabase = await createClient();

			const { data: categories, error } = await supabase
				.from("store_categories")
				.select("*")
				.order("id");

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch categories" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: categories,
				meta: { total: categories?.length ?? 0 },
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
	async (req) => {
		try {
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
				.insert({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
				})
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
