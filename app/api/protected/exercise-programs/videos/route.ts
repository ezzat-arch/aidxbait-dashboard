import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type { CreateVideoData } from "@/types/exercise-program-types";

const handleGetVideos = withPermission(
	[Permission.ViewExercisePrograms],
	async (req, context, user) => {
		try {
			const supabase = await createClient();

			// Fetch all videos (excluding soft deleted)
			// Using .range(0, 9999) to bypass Supabase's default row limit
			const { data: videos, error } = await supabase
				.from("videos")
				.select("*")
				.eq("soft_deleted", false)
				.order("created_at", { ascending: false })
				.range(0, 9999);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch videos" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: videos || [],
				meta: { total: videos?.length || 0 },
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

const handleCreateVideo = withPermission(
	[Permission.ManageVideos],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const body: CreateVideoData = await req.json();

			// Basic validation
			if (
				!body.code ||
				!body.title ||
				!body.title_ar ||
				!body.s3_key ||
				!body.category ||
				!body.category_ar
			) {
				return NextResponse.json(
					{
						error:
							"Code, title (EN & AR), category (EN & AR), and S3 key are required",
					},
					{ status: 400 }
				);
			}

			if (body.duration < 0) {
				return NextResponse.json(
					{ error: "Duration must be a positive number" },
					{ status: 400 }
				);
			}

			if (body.size_mb < 0) {
				return NextResponse.json(
					{ error: "File size must be a positive number" },
					{ status: 400 }
				);
			}

			// Check if code already exists
			const { data: existingVideo, error: checkError } = await supabase
				.from("videos")
				.select("id")
				.eq("code", body.code.trim())
				.eq("soft_deleted", false)
				.single();

			if (checkError && checkError.code !== "PGRST116") {
				// PGRST116 means no rows found, which is what we want
				console.error("Database error checking code:", checkError);
				return NextResponse.json(
					{ error: "Failed to validate video code" },
					{ status: 500 }
				);
			}

			if (existingVideo) {
				return NextResponse.json(
					{ error: "A video with this code already exists" },
					{ status: 409 }
				);
			}

			// Create video
			const { data: video, error } = await supabase
				.from("videos")
				.insert({
					code: body.code.trim(),
					title: body.title.trim(),
					title_ar: body.title_ar.trim(),
					category: body.category.trim(),
					category_ar: body.category_ar.trim(),
					description: body.description?.trim() || null,
					description_ar: body.description_ar?.trim() || null,
					s3_key: body.s3_key.trim(),
					duration: body.duration,
					size_mb: body.size_mb,
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
						{ error: "A video with this code already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create video" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: video, message: "Video created successfully" },
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

export const GET = handleGetVideos;
export const POST = handleCreateVideo;
