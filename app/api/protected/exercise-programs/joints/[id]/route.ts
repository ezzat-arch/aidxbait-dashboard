import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetProgramJoint = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const { id } = await context.params;
			const jointId = parseInt(id);

			if (isNaN(jointId)) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Fetch program joint name
			const { data: joint, error } = await supabase
				.from("program_joint_names")
				.select("*")
				.eq("id", jointId)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Program joint not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json({ data: joint });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateProgramJoint = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const { id } = await context.params;
			const jointId = parseInt(id);

			if (isNaN(jointId)) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

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

			// Update program joint name
			const { data: joint, error } = await supabase
				.from("program_joint_names")
				.update({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
				})
				.eq("id", jointId)
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
					{ error: "Failed to update program joint name" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: joint,
				message: "Program joint name updated successfully",
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

const handleDeleteProgramJoint = withPermission(
	[Permission.DeleteExercisePrograms],
	async (req, context, user) => {
		try {
			const { id } = await context.params;
			const jointId = parseInt(id);

			if (isNaN(jointId)) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Check if joint is used by programs
			const { data: programs, error: programsError } = await supabase
				.from("programs")
				.select("id")
				.eq("joint_id", jointId);

			if (programsError) {
				console.error("Database error checking programs:", programsError);
				return NextResponse.json(
					{ error: "Failed to check joint usage" },
					{ status: 500 }
				);
			}

			if (programs && programs.length > 0) {
				return NextResponse.json(
					{ error: "Cannot delete joint that is linked to programs" },
					{ status: 400 }
				);
			}

			// Delete program joint name
			const { error } = await supabase
				.from("program_joint_names")
				.delete()
				.eq("id", jointId);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete program joint name" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Program joint name deleted successfully",
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

export const GET = handleGetProgramJoint;
export const PUT = handleUpdateProgramJoint;
export const DELETE = handleDeleteProgramJoint;
