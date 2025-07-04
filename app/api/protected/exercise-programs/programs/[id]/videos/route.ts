import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type {
	AddVideoToProgramData,
	UpdateProgramVideoOrderData,
} from "@/types/exercise-program-types";

const handleGetProgramVideos = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const programId = context.params.id;

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			// Fetch program videos with video details
			const { data: programVideos, error } = await supabase
				.from("program_videos")
				.select(
					`
					*,
					videos(*, soft_deleted)
				`
				)
				.eq("program_id", programId)
				.order("sort_order", { ascending: true });

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch program videos" },
					{ status: 500 }
				);
			}

			// Filter out soft deleted videos and format response
			const activeVideos = (programVideos || [])
				.filter((pv: any) => !pv.videos.soft_deleted)
				.map((pv: any) => ({
					...pv.videos,
					sort_order: pv.sort_order,
					program_video_id: pv.id,
				}));

			return NextResponse.json({
				data: activeVideos,
				meta: { total: activeVideos.length },
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

const handleAddVideoToProgram = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const programId = context.params.id;
			const body: Omit<AddVideoToProgramData, "program_id"> = await req.json();

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			if (!body.video_id) {
				return NextResponse.json(
					{ error: "Video ID is required" },
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

			// Check if video is already in the program
			const { data: existingRelation, error: relationError } = await supabase
				.from("program_videos")
				.select("id")
				.eq("program_id", programId)
				.eq("video_id", body.video_id)
				.single();

			if (existingRelation) {
				return NextResponse.json(
					{ error: "Video is already in this program" },
					{ status: 409 }
				);
			}

			// Get the next sort order
			const { data: maxOrder } = await supabase
				.from("program_videos")
				.select("sort_order")
				.eq("program_id", programId)
				.order("sort_order", { ascending: false })
				.limit(1)
				.single();

			const nextSortOrder =
				body.sort_order !== undefined
					? body.sort_order
					: (maxOrder?.sort_order || 0) + 1;

			// Add video to program
			const { data: programVideo, error } = await supabase
				.from("program_videos")
				.insert({
					program_id: Number(programId),
					video_id: body.video_id,
					sort_order: nextSortOrder,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
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
					{ error: "Failed to add video to program" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: {
					...programVideo.videos,
					sort_order: programVideo.sort_order,
					program_video_id: programVideo.id,
				},
				message: "Video added to program successfully",
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

const handleUpdateVideoOrder = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const programId = context.params.id;
			const body: Omit<UpdateProgramVideoOrderData, "program_id"> =
				await req.json();

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			if (!body.video_orders || !Array.isArray(body.video_orders)) {
				return NextResponse.json(
					{ error: "Video orders array is required" },
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

			// Update sort orders for each video
			const updatePromises = body.video_orders.map(async (order) => {
				const { error } = await supabase
					.from("program_videos")
					.update({
						sort_order: order.sort_order,
						updated_at: new Date().toISOString(),
					})
					.eq("program_id", programId)
					.eq("video_id", order.video_id);

				if (error) {
					console.error(
						"Failed to update sort order for video:",
						order.video_id,
						error
					);
					throw error;
				}
			});

			await Promise.all(updatePromises);

			return NextResponse.json({
				message: "Video order updated successfully",
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Failed to update video order" },
				{ status: 500 }
			);
		}
	}
);

export const GET = handleGetProgramVideos;
export const POST = handleAddVideoToProgram;
export const PUT = handleUpdateVideoOrder;
