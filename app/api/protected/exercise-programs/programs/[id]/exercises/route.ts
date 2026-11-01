import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { CreateProgramExerciseData } from "@/types/exercise-program-types";

const handleGetProgramExercises = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;
			const programId = context.params.id;

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Fetch program exercises with video details
			const { data: exercises, error } = await supabase
				.from("program_exercises")
				.select(
					`
					*,
					videos!inner(*)
				`
				)
				.eq("program_id", programId)
				.eq("videos.soft_deleted", false)
				.order("start_week", { ascending: true })
				.order("display_order", { ascending: true });

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch program exercises" },
					{ status: 500 }
				);
			}

			// Transform response to include video as nested object
			const formattedExercises = (exercises || []).map((exercise: any) => ({
				id: exercise.id,
				program_id: exercise.program_id,
				video_id: exercise.video_id,
				start_week: exercise.start_week,
				end_week: exercise.end_week,
				display_order: exercise.display_order,
				volume_type: exercise.volume_type,
				sets: exercise.sets,
				reps: exercise.reps,
				hold_seconds: exercise.hold_seconds,
				notes: exercise.notes,
				notes_ar: exercise.notes_ar,
				created_at: exercise.created_at,
				updated_at: exercise.updated_at,
				video: exercise.videos,
			}));

			return NextResponse.json({
				data: formattedExercises,
				meta: { total: formattedExercises.length },
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

const handleCreateProgramExercise = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;
			const programId = context.params.id;
			const body: CreateProgramExerciseData = await req.json();

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Validate required fields
			if (!body.video_id) {
				return NextResponse.json(
					{ error: "Video ID is required" },
					{ status: 400 }
				);
			}

			if (
				body.start_week === undefined ||
				body.start_week < 1 ||
				body.end_week === undefined ||
				body.end_week < 1
			) {
				return NextResponse.json(
					{ error: "Valid start_week and end_week are required (min: 1)" },
					{ status: 400 }
				);
			}

			if (body.start_week > body.end_week) {
				return NextResponse.json(
					{ error: "start_week must be less than or equal to end_week" },
					{ status: 400 }
				);
			}

			// Validate volume_type is required
			if (!body.volume_type) {
				return NextResponse.json(
					{ error: "volume_type is required (reps, hold, or reps_with_hold)" },
					{ status: 400 }
				);
			}

			// Validate volume_type is a valid enum value
			const validVolumeTypes = ["reps", "hold", "reps_with_hold"];
			if (!validVolumeTypes.includes(body.volume_type)) {
				return NextResponse.json(
					{
						error: `Invalid volume_type: ${body.volume_type}. Must be one of: ${validVolumeTypes.join(", ")}`,
					},
					{ status: 400 }
				);
			}

			// Validate field combinations based on volume_type
			const hasSets = body.sets !== undefined && body.sets !== null && body.sets >= 1;
			const hasReps = body.reps !== undefined && body.reps !== null && body.reps >= 1;
			const hasHoldSeconds =
				body.hold_seconds !== undefined && body.hold_seconds !== null && body.hold_seconds >= 1;

			switch (body.volume_type) {
				case "reps":
					if (!hasSets || !hasReps) {
						return NextResponse.json(
							{ error: "volume_type 'reps' requires sets and reps (≥1)" },
							{ status: 400 }
						);
					}
					if (hasHoldSeconds) {
						return NextResponse.json(
							{ error: "volume_type 'reps' must not include hold_seconds" },
							{ status: 400 }
						);
					}
					break;
				case "hold":
					if (!hasSets || !hasHoldSeconds) {
						return NextResponse.json(
							{ error: "volume_type 'hold' requires sets and hold_seconds (≥1)" },
							{ status: 400 }
						);
					}
					if (hasReps) {
						return NextResponse.json(
							{ error: "volume_type 'hold' must not include reps" },
							{ status: 400 }
						);
					}
					break;
				case "reps_with_hold":
					if (!hasSets || !hasReps || !hasHoldSeconds) {
						return NextResponse.json(
							{
								error:
									"volume_type 'reps_with_hold' requires sets, reps, and hold_seconds (all ≥1)",
							},
							{ status: 400 }
						);
					}
					break;
			}

			// Check if program exists
			const { data: program, error: programError } = await supabase
				.from("programs")
				.select("id")
				.eq("id", programId)
				.eq("soft_deleted", false)
				.single();

			if (programError) {
				if (programError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Program not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", programError);
				return NextResponse.json(
					{ error: "Failed to check program existence" },
					{ status: 500 }
				);
			}

			// Check if video exists and is not soft deleted
			const { data: video, error: videoError } = await supabase
				.from("videos")
				.select("id")
				.eq("id", body.video_id)
				.eq("soft_deleted", false)
				.single();

			if (videoError) {
				if (videoError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Video not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", videoError);
				return NextResponse.json(
					{ error: "Failed to check video existence" },
					{ status: 500 }
				);
			}

			// Get the next display order if not provided
			let displayOrder = body.display_order;
			if (displayOrder === undefined) {
				const { data: maxOrder } = await supabase
					.from("program_exercises")
					.select("display_order")
					.eq("program_id", programId)
					.order("display_order", { ascending: false })
					.limit(1)
					.single();

				displayOrder = (maxOrder?.display_order || 0) + 1;
			}

			// Prepare insert data based on volume_type
			const insertData: any = {
				program_id: Number(programId),
				video_id: body.video_id,
				start_week: body.start_week,
				end_week: body.end_week,
				display_order: displayOrder,
				volume_type: body.volume_type,
				notes: body.notes?.trim() || null,
				notes_ar: body.notes_ar?.trim() || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			// Set fields based on volume_type (already validated above)
			switch (body.volume_type) {
				case "reps":
					insertData.sets = body.sets;
					insertData.reps = body.reps;
					insertData.hold_seconds = null;
					break;
				case "hold":
					insertData.sets = body.sets;
					insertData.reps = null;
					insertData.hold_seconds = body.hold_seconds;
					break;
				case "reps_with_hold":
					insertData.sets = body.sets;
					insertData.reps = body.reps;
					insertData.hold_seconds = body.hold_seconds;
					break;
			}

			// Create the exercise
			const { data: exercise, error } = await supabase
				.from("program_exercises")
				.insert(insertData)
				.select(
					`
					*,
					videos(*)
				`
				)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to create exercise" },
					{ status: 500 }
				);
			}

			// Format response
			const formattedExercise = {
				...exercise,
				video: exercise.videos,
			};
			delete formattedExercise.videos;

			return NextResponse.json(
				{
					data: formattedExercise,
					message: "Exercise added to program successfully",
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

export const GET = handleGetProgramExercises;
export const POST = handleCreateProgramExercise;

