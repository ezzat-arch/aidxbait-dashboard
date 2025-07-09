import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { UpdateProgramData } from "@/types/exercise-program-types";

// Create Supabase client with service_role key for storage operations
const createStorageServiceClient = () => {
	return createServiceClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
				detectSessionInUrl: false,
			},
		}
	);
};

const handleGetProgram = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const id = context.params.id;

			if (!id || isNaN(Number(id))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Fetch program with its videos (excluding soft deleted program)
			const { data: program, error } = await supabase
				.from("programs")
				.select(
					`
					*,
					joints (
						id,
						name
					),
					program_videos(
						sort_order,
						videos(*, soft_deleted)
					)
				`
				)
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Program not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch program" },
					{ status: 500 }
				);
			}

			// Filter out soft deleted videos and add computed fields
			const activeVideos = (program.program_videos || [])
				.filter((pv: any) => !pv.videos.soft_deleted)
				.map((pv: any) => ({
					...pv.videos,
					sort_order: pv.sort_order,
				}))
				.sort((a: any, b: any) => a.sort_order - b.sort_order);

			const totalDuration = activeVideos.reduce(
				(sum: number, video: any) => sum + (video.duration || 0),
				0
			);

			const enrichedProgram = {
				...program,
				videos: activeVideos,
				video_count: activeVideos.length,
				total_duration: totalDuration,
				program_videos: undefined, // Remove the raw join data
			};

			return NextResponse.json({ data: enrichedProgram });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateProgram = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const id = context.params.id;
			const body: Omit<UpdateProgramData, "id"> = await req.json();

			if (!id || isNaN(Number(id))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Validate price if provided
			if (body.price !== undefined && body.price < 0) {
				return NextResponse.json(
					{ error: "Price must be a positive number" },
					{ status: 400 }
				);
			}

			// Validate joint_id if provided
			if (body.joint_id !== undefined) {
				if (typeof body.joint_id !== "number") {
					return NextResponse.json(
						{ error: "Joint ID must be a number" },
						{ status: 400 }
					);
				}

				// Verify that the joint exists
				const { data: joint, error: jointError } = await supabase
					.from("joints")
					.select("id")
					.eq("id", body.joint_id)
					.single();

				if (jointError || !joint) {
					return NextResponse.json(
						{ error: "Invalid joint ID" },
						{ status: 400 }
					);
				}
			}

			// Check if program exists and is not soft deleted
			const { data: existingProgram, error: fetchError } = await supabase
				.from("programs")
				.select("id, thumbnail_url")
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (fetchError) {
				if (fetchError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Program not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", fetchError);
				return NextResponse.json(
					{ error: "Failed to check program existence" },
					{ status: 500 }
				);
			}

			// Prepare update data
			const updateData: Record<string, any> = {
				updated_at: new Date().toISOString(),
			};

			if (body.title !== undefined) {
				updateData.title = body.title.trim();
			}
			if (body.title_ar !== undefined) {
				updateData.title_ar = body.title_ar.trim();
			}
			if (body.description !== undefined) {
				updateData.description = body.description?.trim() || null;
			}
			if (body.description_ar !== undefined) {
				updateData.description_ar = body.description_ar?.trim() || null;
			}
			if (body.joint_id !== undefined) {
				updateData.joint_id = body.joint_id;
			}
			if (body.price !== undefined) {
				updateData.price = body.price;
			}
			if (body.thumbnail_url !== undefined) {
				updateData.thumbnail_url = body.thumbnail_url.trim();
			}

			// Handle thumbnail cleanup if a new thumbnail URL is provided
			let oldImageCleanup = null;
			if (
				body.thumbnail_url !== undefined &&
				existingProgram.thumbnail_url !== body.thumbnail_url
			) {
				// Extract the filename from the old thumbnail URL to delete it later
				const oldUrl = existingProgram.thumbnail_url;
				if (oldUrl && oldUrl.includes("program-thumbnails/")) {
					const urlParts = oldUrl.split("program-thumbnails/");
					if (urlParts.length > 1) {
						oldImageCleanup = urlParts[1].split("?")[0]; // Remove query params if any
					}
				}
			}

			// Update program
			const { data: program, error } = await supabase
				.from("programs")
				.update(updateData)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				if (error.code === "23503") {
					return NextResponse.json(
						{ error: "Invalid joint ID reference" },
						{ status: 400 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to update program" },
					{ status: 500 }
				);
			}

			// Clean up old thumbnail if needed
			if (oldImageCleanup) {
				try {
					const storageClient = createStorageServiceClient();
					await storageClient.storage
						.from("program-thumbnails")
						.remove([oldImageCleanup]);
				} catch (cleanupError) {
					// Don't fail the update if cleanup fails, just log it
					console.error("Failed to cleanup old thumbnail:", cleanupError);
				}
			}

			return NextResponse.json({
				data: program,
				message: "Program updated successfully",
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

const handleDeleteProgram = withPermission(
	[Permission.DeleteExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const id = context.params.id;

			if (!id || isNaN(Number(id))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Check if program exists and is not already soft deleted
			const { data: existingProgram, error: fetchError } = await supabase
				.from("programs")
				.select("id")
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (fetchError) {
				if (fetchError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Program not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", fetchError);
				return NextResponse.json(
					{ error: "Failed to check program existence" },
					{ status: 500 }
				);
			}

			// Soft delete the program
			const { error } = await supabase
				.from("programs")
				.update({
					soft_deleted: true,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete program" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Program deleted successfully",
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

export const GET = handleGetProgram;
export const PUT = handleUpdateProgram;
export const DELETE = handleDeleteProgram;
