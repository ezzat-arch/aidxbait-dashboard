import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetJoints = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			// Fetch joints
			const { data: joints, error } = await supabase
				.from("joints")
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

			// Create joint
			const { data: joint, error } = await supabase
				.from("joints")
				.insert({
					name: body.name.trim(),
				})
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				// Handle unique constraint violations
				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A joint with this name already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create joint" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: joint, message: "Joint created successfully" },
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
