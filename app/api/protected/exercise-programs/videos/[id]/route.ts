import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { UpdateVideoData } from "@/types/exercise-program-types";

const handleGetVideo = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const id = context.params.id;

			if (!id || isNaN(Number(id))) {
				return NextResponse.json(
					{ error: "Invalid video ID" },
					{ status: 400 }
				);
			}

			const { data: video, error } = await supabase
				.from("videos")
				.select("*")
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Video not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch video" },
					{ status: 500 }
				);
			}

			return NextResponse.json({ data: video });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateVideo = withPermission(
	[Permission.ManageVideos],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const id = context.params.id;
			const body: Omit<UpdateVideoData, "id"> = await req.json();

			if (!id || isNaN(Number(id))) {
				return NextResponse.json(
					{ error: "Invalid video ID" },
					{ status: 400 }
				);
			}

			// Validate duration if provided
			if (body.duration !== undefined && body.duration < 0) {
				return NextResponse.json(
					{ error: "Duration must be a positive number" },
					{ status: 400 }
				);
			}

			// Check if video exists and is not soft deleted
			const { data: existingVideo, error: fetchError } = await supabase
				.from("videos")
				.select("id")
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (fetchError) {
				if (fetchError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Video not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", fetchError);
				return NextResponse.json(
					{ error: "Failed to check video existence" },
					{ status: 500 }
				);
			}

			// Prepare update data (only allowed fields)
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
			if (body.duration !== undefined) {
				updateData.duration = body.duration;
			}

			// Update video
			const { data: video, error } = await supabase
				.from("videos")
				.update(updateData)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to update video" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: video,
				message: "Video updated successfully",
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

const handleDeleteVideo = withPermission(
	[Permission.ManageVideos],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const id = context.params.id;

			if (!id || isNaN(Number(id))) {
				return NextResponse.json(
					{ error: "Invalid video ID" },
					{ status: 400 }
				);
			}

			// Check if video exists and is not already soft deleted
			const { data: existingVideo, error: fetchError } = await supabase
				.from("videos")
				.select("id")
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (fetchError) {
				if (fetchError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Video not found" },
						{ status: 404 }
					);
				}
				console.error("Database error:", fetchError);
				return NextResponse.json(
					{ error: "Failed to check video existence" },
					{ status: 500 }
				);
			}

			// Soft delete the video
			const { error } = await supabase
				.from("videos")
				.update({
					soft_deleted: true,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete video" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Video deleted successfully",
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

export const GET = handleGetVideo;
export const PUT = handleUpdateVideo;
export const DELETE = handleDeleteVideo;
