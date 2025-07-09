import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

// Create Supabase client with service_role key for elevated privileges
const createServiceClient = () => {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
				detectSessionInUrl: false,
			},
		}
	);
};

const handleThumbnailUpload = withPermission(
	[Permission.CreateExercisePrograms, Permission.UpdateExercisePrograms],
	async (req: NextRequest, context, user) => {
		try {
			// Parse form data
			const formData = await req.formData();
			const file = formData.get("file") as File;

			if (!file) {
				return NextResponse.json(
					{ error: "No file provided" },
					{ status: 400 }
				);
			}

			// Validate file type
			const allowedTypes = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/webp",
			];

			if (!allowedTypes.includes(file.type)) {
				return NextResponse.json(
					{
						error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.`,
					},
					{ status: 400 }
				);
			}

			// Validate file size (5MB limit)
			const maxFileSize = 5 * 1024 * 1024; // 5MB
			if (file.size > maxFileSize) {
				return NextResponse.json(
					{ error: `File ${file.name} exceeds 5MB limit.` },
					{ status: 400 }
				);
			}

			// Generate unique filename
			const fileExt = file.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random()
				.toString(36)
				.substring(2)}.${fileExt}`;

			// Convert file to buffer
			const bytes = await file.arrayBuffer();

			// Upload to Supabase storage using service_role client
			const supabase = createServiceClient();
			const { data, error } = await supabase.storage
				.from("program-thumbnails")
				.upload(fileName, bytes, {
					cacheControl: "3600",
					upsert: false,
					contentType: file.type,
				});

			if (error) {
				console.error("Storage upload error:", error);
				return NextResponse.json(
					{ error: `Failed to upload ${file.name}: ${error.message}` },
					{ status: 500 }
				);
			}

			// Get public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from("program-thumbnails").getPublicUrl(fileName);

			return NextResponse.json(
				{
					data: {
						filename: file.name,
						url: publicUrl,
						size: file.size,
						type: file.type,
					},
					message: "Thumbnail uploaded successfully",
				},
				{ status: 200 }
			);
		} catch (error) {
			console.error("Thumbnail upload error:", error);
			return NextResponse.json(
				{
					error:
						error instanceof Error
							? error.message
							: "Failed to upload thumbnail",
				},
				{ status: 500 }
			);
		}
	}
);

export const POST = handleThumbnailUpload;
