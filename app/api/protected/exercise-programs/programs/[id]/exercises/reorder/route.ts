import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { UpdateExerciseOrderData } from "@/types/exercise-program-types";

/**
 * PATCH /api/protected/exercise-programs/programs/[id]/exercises/reorder
 *
 * Batch update display_order for multiple exercises in a program.
 * Used for reordering exercises within week groups via up/down arrows.
 *
 * Request body: { exercise_orders: [{ exercise_id, display_order }] }
 */
const handleReorderExercises = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = supabaseAdmin;
			const programId = context.params.id;
			const body: UpdateExerciseOrderData = await req.json();

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Validate request body
			if (!body.exercise_orders || !Array.isArray(body.exercise_orders)) {
				return NextResponse.json(
					{ error: "exercise_orders array is required" },
					{ status: 400 }
				);
			}

			if (body.exercise_orders.length === 0) {
				return NextResponse.json(
					{ error: "exercise_orders array cannot be empty" },
					{ status: 400 }
				);
			}

			// Validate each order entry
			for (const order of body.exercise_orders) {
				if (!order.exercise_id || typeof order.exercise_id !== "number") {
					return NextResponse.json(
						{ error: "Each order entry must have a valid exercise_id" },
						{ status: 400 }
					);
				}
				if (
					order.display_order === undefined ||
					typeof order.display_order !== "number" ||
					order.display_order < 0
				) {
					return NextResponse.json(
						{ error: "Each order entry must have a valid display_order (≥0)" },
						{ status: 400 }
					);
				}
			}

			// Check that the program exists
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

			// Verify all exercise IDs belong to this program
			const exerciseIds = body.exercise_orders.map((o) => o.exercise_id);
			const { data: exercises, error: exercisesError } = await supabase
				.from("program_exercises")
				.select("id")
				.eq("program_id", programId)
				.in("id", exerciseIds);

			if (exercisesError) {
				console.error("Database error:", exercisesError);
				return NextResponse.json(
					{ error: "Failed to verify exercises" },
					{ status: 500 }
				);
			}

			const foundIds = new Set((exercises || []).map((e) => e.id));
			const missingIds = exerciseIds.filter((id) => !foundIds.has(id));

			if (missingIds.length > 0) {
				return NextResponse.json(
					{
						error: `Exercises not found in this program: ${missingIds.join(", ")}`,
					},
					{ status: 404 }
				);
			}

			// Update display_order for each exercise
			// Using individual updates since Supabase doesn't support batch updates with different values
			const updatePromises = body.exercise_orders.map((order) =>
				supabase
					.from("program_exercises")
					.update({
						display_order: order.display_order,
						updated_at: new Date().toISOString(),
					})
					.eq("id", order.exercise_id)
					.eq("program_id", programId)
			);

			const results = await Promise.all(updatePromises);

			// Check for any errors
			const errors = results.filter((r) => r.error);
			if (errors.length > 0) {
				console.error("Some updates failed:", errors.map((e) => e.error));
				return NextResponse.json(
					{ error: "Failed to update some exercise orders" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Exercise order updated successfully",
				updated_count: body.exercise_orders.length,
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

export const PATCH = handleReorderExercises;

