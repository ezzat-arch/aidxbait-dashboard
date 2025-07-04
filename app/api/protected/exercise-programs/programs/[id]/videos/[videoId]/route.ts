import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleRemoveVideoFromProgram = withPermission(
	[Permission.UpdateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const programId = context.params.id;
			const videoId = context.params.videoId;

			if (!programId || isNaN(Number(programId))) {
				return NextResponse.json(
					{ error: "Invalid program ID" },
					{ status: 400 }
				);
			}

			if (!videoId || isNaN(Number(videoId))) {
				return NextResponse.json(
					{ error: "Invalid video ID" },
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

			// Check if the program-video relationship exists
			const { data: programVideo, error: relationError } = await supabase
				.from("program_videos")
				.select("id")
				.eq("program_id", programId)
				.eq("video_id", videoId)
				.single();

			if (relationError) {
				if (relationError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Video is not in this program" },
						{ status: 404 }
					);
				}
				console.error("Database error:", relationError);
				return NextResponse.json(
					{ error: "Failed to check video-program relationship" },
					{ status: 500 }
				);
			}

			// Remove video from program
			const { error } = await supabase
				.from("program_videos")
				.delete()
				.eq("program_id", programId)
				.eq("video_id", videoId);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to remove video from program" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Video removed from program successfully",
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

export const DELETE = handleRemoveVideoFromProgram;
