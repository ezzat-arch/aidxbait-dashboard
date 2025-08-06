import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetJoints = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			// Fetch product joint names
			const { data: joints, error } = await supabase
				.from("product_joint_names")
				.select("*")
				.order("id");

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch joints" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: joints,
				meta: { total: joints.length },
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

const handleCreateJoint = withPermission(
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

			if (!body.name_ar || typeof body.name_ar !== "string") {
				return NextResponse.json(
					{ error: "Arabic name is required and must be a string" },
					{ status: 400 }
				);
			}

			// Create product joint name
			const { data: joint, error } = await supabase
				.from("product_joint_names")
				.insert({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
				})
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				// Handle unique constraint violations
				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A product joint name with this name already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create product joint name" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: joint, message: "Product joint name created successfully" },
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

export const GET = handleGetJoints;
export const POST = handleCreateJoint;
