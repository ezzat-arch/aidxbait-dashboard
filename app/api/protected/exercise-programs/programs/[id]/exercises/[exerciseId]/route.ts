import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { UpdateProgramExerciseData } from "@/types/exercise-program-types";

const handleUpdateExercise = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;
			const programId = context.params.id;
			const exerciseId = context.params.exerciseId;
			const body: UpdateProgramExerciseData = await req.json();

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			if (!exerciseId || isNaN(Number(exerciseId))) {
				return NextResponse.json(
					{ error: "Invalid exercise ID" },
					{ status: 400 }
				);
			}

			// Check if exercise exists and belongs to the program
			const { data: existingExercise, error: checkError } = await supabase
				.from("program_exercises")
				.select("*")
				.eq("id", exerciseId)
				.eq("program_id", programId)
				.single();

			if (checkError) {
				if (checkError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Exercise not found in this program" },
						{ status: 404 }
					);
				}
				console.error("Database error:", checkError);
				return NextResponse.json(
					{ error: "Failed to check exercise existence" },
					{ status: 500 }
				);
			}

			// Validate week range if provided
			const startWeek = body.start_week ?? existingExercise.start_week;
			const endWeek = body.end_week ?? existingExercise.end_week;

			if (startWeek < 1 || endWeek < 1) {
				return NextResponse.json(
					{ error: "Week values must be at least 1" },
					{ status: 400 }
				);
			}

			if (startWeek > endWeek) {
				return NextResponse.json(
					{ error: "start_week must be less than or equal to end_week" },
					{ status: 400 }
				);
			}

			// Build update data
			const updateData: any = {
				updated_at: new Date().toISOString(),
			};

			if (body.start_week !== undefined) {
				updateData.start_week = body.start_week;
			}
			if (body.end_week !== undefined) {
				updateData.end_week = body.end_week;
			}
			if (body.display_order !== undefined) {
				updateData.display_order = body.display_order;
			}
			if (body.notes !== undefined) {
				updateData.notes = body.notes?.trim() || null;
			}
			if (body.notes_ar !== undefined) {
				updateData.notes_ar = body.notes_ar?.trim() || null;
			}

			// Handle volume type updates
			// When volume_type is provided, validate and set all volume fields
			if (body.volume_type !== undefined) {
				const validVolumeTypes = ["reps", "hold", "reps_with_hold"];
				if (!validVolumeTypes.includes(body.volume_type)) {
					return NextResponse.json(
						{
							error: `Invalid volume_type: ${body.volume_type}. Must be one of: ${validVolumeTypes.join(", ")}`,
						},
						{ status: 400 }
					);
				}

				updateData.volume_type = body.volume_type;

				switch (body.volume_type) {
					case "reps":
						// Require sets and reps, reject hold_seconds
						if (body.sets === undefined || body.sets === null || body.sets < 1) {
							return NextResponse.json(
								{ error: "volume_type 'reps' requires sets (≥1)" },
								{ status: 400 }
							);
						}
						if (body.reps === undefined || body.reps === null || body.reps < 1) {
							return NextResponse.json(
								{ error: "volume_type 'reps' requires reps (≥1)" },
								{ status: 400 }
							);
						}
						updateData.sets = body.sets;
						updateData.reps = body.reps;
						updateData.hold_seconds = null;
						break;

					case "hold":
						// Require sets and hold_seconds, reject reps
						if (body.sets === undefined || body.sets === null || body.sets < 1) {
							return NextResponse.json(
								{ error: "volume_type 'hold' requires sets (≥1)" },
								{ status: 400 }
							);
						}
						if (
							body.hold_seconds === undefined ||
							body.hold_seconds === null ||
							body.hold_seconds < 1
						) {
							return NextResponse.json(
								{ error: "volume_type 'hold' requires hold_seconds (≥1)" },
								{ status: 400 }
							);
						}
						updateData.sets = body.sets;
						updateData.reps = null;
						updateData.hold_seconds = body.hold_seconds;
						break;

					case "reps_with_hold":
						// Require all three: sets, reps, and hold_seconds
						if (body.sets === undefined || body.sets === null || body.sets < 1) {
							return NextResponse.json(
								{ error: "volume_type 'reps_with_hold' requires sets (≥1)" },
								{ status: 400 }
							);
						}
						if (body.reps === undefined || body.reps === null || body.reps < 1) {
							return NextResponse.json(
								{ error: "volume_type 'reps_with_hold' requires reps (≥1)" },
								{ status: 400 }
							);
						}
						if (
							body.hold_seconds === undefined ||
							body.hold_seconds === null ||
							body.hold_seconds < 1
						) {
							return NextResponse.json(
								{ error: "volume_type 'reps_with_hold' requires hold_seconds (≥1)" },
								{ status: 400 }
							);
						}
						updateData.sets = body.sets;
						updateData.reps = body.reps;
						updateData.hold_seconds = body.hold_seconds;
						break;
				}
			} else {
				// No volume_type change - allow partial updates to volume fields
				// The database CHECK constraint will validate the final state
				if (body.sets !== undefined) {
					updateData.sets = body.sets;
				}
				if (body.reps !== undefined) {
					updateData.reps = body.reps;
				}
				if (body.hold_seconds !== undefined) {
					updateData.hold_seconds = body.hold_seconds;
				}
			}

			// Update the exercise
			const { data: exercise, error } = await supabase
				.from("program_exercises")
				.update(updateData)
				.eq("id", exerciseId)
				.eq("program_id", programId)
				.select(
					`
					*,
					videos(*)
				`
				)
				.single();

			if (error) {
				console.error("Database error:", error);
				// Check for constraint violation
				if (error.code === "23514") {
					return NextResponse.json(
						{
							error:
								"Invalid volume configuration. Valid combinations: 'reps' (sets + reps), 'hold' (sets + hold_seconds), 'reps_with_hold' (sets + reps + hold_seconds)",
						},
						{ status: 400 }
					);
				}
				return NextResponse.json(
					{ error: "Failed to update exercise" },
					{ status: 500 }
				);
			}

			// Format response
			const formattedExercise = {
				...exercise,
				video: exercise.videos,
			};
			delete formattedExercise.videos;

			return NextResponse.json({
				data: formattedExercise,
				message: "Exercise updated successfully",
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

const handleDeleteExercise = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;
			const programId = context.params.id;
			const exerciseId = context.params.exerciseId;

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			if (!exerciseId || isNaN(Number(exerciseId))) {
				return NextResponse.json(
					{ error: "Invalid exercise ID" },
					{ status: 400 }
				);
			}

			// Check if exercise exists and belongs to the program
			const { data: exercise, error: checkError } = await supabase
				.from("program_exercises")
				.select("id")
				.eq("id", exerciseId)
				.eq("program_id", programId)
				.single();

			if (checkError) {
				if (checkError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Exercise not found in this program" },
						{ status: 404 }
					);
				}
				console.error("Database error:", checkError);
				return NextResponse.json(
					{ error: "Failed to check exercise existence" },
					{ status: 500 }
				);
			}

			// Delete the exercise
			const { error } = await supabase
				.from("program_exercises")
				.delete()
				.eq("id", exerciseId)
				.eq("program_id", programId);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete exercise" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Exercise removed from program successfully",
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

export const PUT = handleUpdateExercise;
export const DELETE = handleDeleteExercise;

