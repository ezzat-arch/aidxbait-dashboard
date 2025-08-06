import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { CreateProgramData } from "@/types/exercise-program-types";

const handleGetPrograms = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			const { data: programs, error: programsError } = await supabase
				.from("programs")
				.select(
					`
					*,
					program_joint_names (
						id,
						name,
						name_ar
					)
				`
				)
				.eq("soft_deleted", false)
				.order("created_at", { ascending: false });

			if (programsError) {
				console.error("Database error:", programsError);
				return NextResponse.json(
					{ error: "Failed to fetch programs" },
					{ status: 500 }
				);
			}

			if (!programs || programs.length === 0) {
				return NextResponse.json({
					data: [],
					meta: { total: 0 },
				});
			}

			// Then, fetch video data for each program
			const processedPrograms = await Promise.all(
				programs.map(async (program) => {
					// Get program videos with video details
					const { data: programVideos, error: videosError } = await supabase
						.from("program_videos")
						.select(
							`
							video_id,
							sort_order,
							videos(id, duration, soft_deleted)
						`
						)
						.eq("program_id", program.id)
						.order("sort_order", { ascending: true });

					// Handle videos error gracefully - program might have no videos
					if (videosError && videosError.code !== "PGRST116") {
						console.error(
							"Error fetching videos for program:",
							program.id,
							videosError
						);
					}

					// Filter out soft deleted videos
					const activeVideos = (programVideos || [])
						.filter((pv: any) => pv.videos && !pv.videos.soft_deleted)
						.map((pv: any) => pv.videos);

					const totalDuration = activeVideos.reduce(
						(sum: number, video: any) => sum + (video.duration || 0),
						0
					);

					return {
						...program,
						video_count: activeVideos.length,
						total_duration: totalDuration,
					};
				})
			);

			return NextResponse.json({
				data: processedPrograms,
				meta: { total: processedPrograms.length },
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

const handleCreateProgram = withPermission(
	[Permission.CreateExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const body: CreateProgramData = await req.json();

			// Basic validation
			if (!body.title || !body.title_ar) {
				return NextResponse.json(
					{ error: "Title (EN & AR) are required" },
					{ status: 400 }
				);
			}

			if (!body.joint_id || typeof body.joint_id !== "number") {
				return NextResponse.json(
					{ error: "Joint ID is required and must be a number" },
					{ status: 400 }
				);
			}

			if (!body.thumbnail_url || typeof body.thumbnail_url !== "string") {
				return NextResponse.json(
					{ error: "Thumbnail URL is required" },
					{ status: 400 }
				);
			}

			if (body.price < 0) {
				return NextResponse.json(
					{ error: "Price must be a positive number" },
					{ status: 400 }
				);
			}

			// Verify that the program joint exists
			const { data: joint, error: jointError } = await supabase
				.from("program_joint_names")
				.select("id")
				.eq("id", body.joint_id)
				.single();

			if (jointError || !joint) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

			// Create program
			const { data: program, error } = await supabase
				.from("programs")
				.insert({
					title: body.title.trim(),
					title_ar: body.title_ar.trim(),
					description: body.description?.trim() || null,
					description_ar: body.description_ar?.trim() || null,
					joint_id: body.joint_id,
					thumbnail_url: body.thumbnail_url.trim(),
					price: body.price,
					soft_deleted: false,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A program with this title already exists" },
						{ status: 409 }
					);
				}

				if (error.code === "23503") {
					return NextResponse.json(
						{ error: "Invalid joint ID reference" },
						{ status: 400 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create program" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: program, message: "Program created successfully" },
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

export const GET = handleGetPrograms;
export const POST = handleCreateProgram;
