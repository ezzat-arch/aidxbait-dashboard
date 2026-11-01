import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetProgramJoints = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;

			// Fetch program joint names
			const { data: joints, error } = await supabase
				.from("program_joint_names")
				.select("*")
				.order("id");

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch program joints" },
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

const handleCreateProgramJoint = withPermission(
	[Permission.CreateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;
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

			// Create program joint name
			const { data: joint, error } = await supabase
				.from("program_joint_names")
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
						{ error: "A program joint name with this name already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create program joint name" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: joint, message: "Program joint name created successfully" },
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

export const GET = handleGetProgramJoints;
export const POST = handleCreateProgramJoint;
