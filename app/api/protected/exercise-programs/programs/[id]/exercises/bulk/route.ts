import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type {
	BulkSyncExercisesPayload,
	CreateProgramExerciseData,
	UpdateProgramExerciseData,
} from "@/types/exercise-program-types";

/**
 * POST /api/protected/exercise-programs/programs/[id]/exercises/bulk
 *
 * Bulk sync exercises for a program. Handles create, update, and delete operations
 * in a single request to reduce network round-trips and improve UX.
 *
 * Request body: BulkSyncExercisesPayload
 * - create: Array of exercises to create
 * - update: Array of { id, data } for exercises to update
 * - delete: Array of exercise IDs to delete
 */
const handleBulkSyncExercises = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const programId = context.params.id;
			const body: BulkSyncExercisesPayload = await req.json();

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
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

			const results = {
				created: [] as any[],
				updated: 0,
				deleted: 0,
				errors: [] as string[],
			};

			// 1. Process deletes first (to free up any constraints)
			if (body.delete && body.delete.length > 0) {
				const deleteResult = await processDeletes(
					supabase,
					Number(programId),
					body.delete
				);
				if (deleteResult.error) {
					results.errors.push(deleteResult.error);
				} else {
					results.deleted = deleteResult.count;
				}
			}

			// 2. Process updates
			if (body.update && body.update.length > 0) {
				const updateResult = await processUpdates(
					supabase,
					Number(programId),
					body.update
				);
				if (updateResult.error) {
					results.errors.push(updateResult.error);
				} else {
					results.updated = updateResult.count;
				}
			}

			// 3. Process creates last
			if (body.create && body.create.length > 0) {
				const createResult = await processCreates(
					supabase,
					Number(programId),
					body.create
				);
				if (createResult.error) {
					results.errors.push(createResult.error);
				} else {
					results.created = createResult.exercises;
				}
			}

			// If there were any errors, return them
			if (results.errors.length > 0) {
				return NextResponse.json(
					{
						error: "Some operations failed",
						details: results.errors,
						partial_results: {
							created: results.created.length,
							updated: results.updated,
							deleted: results.deleted,
						},
					},
					{ status: 207 } // Multi-Status
				);
			}

			return NextResponse.json({
				data: {
					created: results.created,
					updated: results.updated,
					deleted: results.deleted,
				},
				message: "Exercises synced successfully",
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

/**
 * Process delete operations
 */
async function processDeletes(
	supabase: any,
	programId: number,
	exerciseIds: number[]
): Promise<{ count: number; error?: string }> {
	try {
		// Verify all exercises belong to this program
		const { data: existing, error: checkError } = await supabase
			.from("program_exercises")
			.select("id")
			.eq("program_id", programId)
			.in("id", exerciseIds);

		if (checkError) {
			console.error("Error checking exercises:", checkError);
			return { count: 0, error: "Failed to verify exercises for deletion" };
		}

		const foundIds = new Set((existing || []).map((e: any) => e.id));
		const validIds = exerciseIds.filter((id) => foundIds.has(id));

		if (validIds.length === 0) {
			return { count: 0 };
		}

		const { error } = await supabase
			.from("program_exercises")
			.delete()
			.eq("program_id", programId)
			.in("id", validIds);

		if (error) {
			console.error("Error deleting exercises:", error);
			return { count: 0, error: "Failed to delete exercises" };
		}

		return { count: validIds.length };
	} catch (error) {
		console.error("Unexpected delete error:", error);
		return { count: 0, error: "Unexpected error during deletion" };
	}
}

/**
 * Process update operations
 */
async function processUpdates(
	supabase: any,
	programId: number,
	updates: { id: number; data: UpdateProgramExerciseData }[]
): Promise<{ count: number; error?: string }> {
	try {
		let successCount = 0;

		for (const { id, data } of updates) {
			// Validate the update data
			const validationError = validateUpdateData(data);
			if (validationError) {
				console.error(`Validation error for exercise ${id}:`, validationError);
				continue;
			}

			const updateData: any = {
				...data,
				updated_at: new Date().toISOString(),
			};

			// Clean up undefined values
			Object.keys(updateData).forEach((key) => {
				if (updateData[key] === undefined) {
					delete updateData[key];
				}
			});

			const { error } = await supabase
				.from("program_exercises")
				.update(updateData)
				.eq("id", id)
				.eq("program_id", programId);

			if (error) {
				console.error(`Error updating exercise ${id}:`, error);
				continue;
			}

			successCount++;
		}

		return { count: successCount };
	} catch (error) {
		console.error("Unexpected update error:", error);
		return { count: 0, error: "Unexpected error during updates" };
	}
}

/**
 * Process create operations
 */
async function processCreates(
	supabase: any,
	programId: number,
	creates: CreateProgramExerciseData[]
): Promise<{ exercises: any[]; error?: string }> {
	try {
		const createdExercises: any[] = [];

		// Get the max display_order for this program
		const { data: maxOrderData } = await supabase
			.from("program_exercises")
			.select("display_order")
			.eq("program_id", programId)
			.order("display_order", { ascending: false })
			.limit(1)
			.single();

		let nextDisplayOrder = (maxOrderData?.display_order || 0) + 1;

		for (const createData of creates) {
			// Validate the create data
			const validationError = validateCreateData(createData);
			if (validationError) {
				console.error("Validation error:", validationError);
				continue;
			}

			// Verify video exists
			const { data: video, error: videoError } = await supabase
				.from("videos")
				.select("id")
				.eq("id", createData.video_id)
				.eq("soft_deleted", false)
				.single();

			if (videoError || !video) {
				console.error(`Video ${createData.video_id} not found`);
				continue;
			}

			// Build insert data
			const insertData: any = {
				program_id: programId,
				video_id: createData.video_id,
				start_week: createData.start_week,
				end_week: createData.end_week,
				display_order: createData.display_order ?? nextDisplayOrder++,
				volume_type: createData.volume_type,
				notes: createData.notes?.trim() || null,
				notes_ar: createData.notes_ar?.trim() || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			// Set volume fields based on volume_type
			switch (createData.volume_type) {
				case "reps":
					insertData.sets = createData.sets;
					insertData.reps = createData.reps;
					insertData.hold_seconds = null;
					break;
				case "hold":
					insertData.sets = createData.sets;
					insertData.reps = null;
					insertData.hold_seconds = createData.hold_seconds;
					break;
				case "reps_with_hold":
					insertData.sets = createData.sets;
					insertData.reps = createData.reps;
					insertData.hold_seconds = createData.hold_seconds;
					break;
			}

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
				console.error("Error creating exercise:", error);
				continue;
			}

			// Format response
			const formattedExercise = {
				...exercise,
				video: exercise.videos,
			};
			delete formattedExercise.videos;

			createdExercises.push(formattedExercise);
		}

		return { exercises: createdExercises };
	} catch (error) {
		console.error("Unexpected create error:", error);
		return { exercises: [], error: "Unexpected error during creation" };
	}
}

/**
 * Validate create data
 */
function validateCreateData(data: CreateProgramExerciseData): string | null {
	if (!data.video_id) {
		return "video_id is required";
	}

	if (data.start_week < 1 || data.end_week < 1) {
		return "start_week and end_week must be at least 1";
	}

	if (data.start_week > data.end_week) {
		return "start_week must be <= end_week";
	}

	if (!data.volume_type) {
		return "volume_type is required";
	}

	const validVolumeTypes = ["reps", "hold", "reps_with_hold"];
	if (!validVolumeTypes.includes(data.volume_type)) {
		return `Invalid volume_type: ${data.volume_type}`;
	}

	// Validate volume fields based on type
	switch (data.volume_type) {
		case "reps":
			if (!data.sets || data.sets < 1 || !data.reps || data.reps < 1) {
				return "volume_type 'reps' requires sets and reps >= 1";
			}
			break;
		case "hold":
			if (
				!data.sets ||
				data.sets < 1 ||
				!data.hold_seconds ||
				data.hold_seconds < 1
			) {
				return "volume_type 'hold' requires sets and hold_seconds >= 1";
			}
			break;
		case "reps_with_hold":
			if (
				!data.sets ||
				data.sets < 1 ||
				!data.reps ||
				data.reps < 1 ||
				!data.hold_seconds ||
				data.hold_seconds < 1
			) {
				return "volume_type 'reps_with_hold' requires sets, reps, and hold_seconds >= 1";
			}
			break;
	}

	return null;
}

/**
 * Validate update data
 */
function validateUpdateData(data: UpdateProgramExerciseData): string | null {
	if (data.start_week !== undefined && data.start_week < 1) {
		return "start_week must be at least 1";
	}

	if (data.end_week !== undefined && data.end_week < 1) {
		return "end_week must be at least 1";
	}

	if (
		data.start_week !== undefined &&
		data.end_week !== undefined &&
		data.start_week > data.end_week
	) {
		return "start_week must be <= end_week";
	}

	if (data.volume_type !== undefined) {
		const validVolumeTypes = ["reps", "hold", "reps_with_hold"];
		if (!validVolumeTypes.includes(data.volume_type)) {
			return `Invalid volume_type: ${data.volume_type}`;
		}
	}

	return null;
}

export const POST = handleBulkSyncExercises;

