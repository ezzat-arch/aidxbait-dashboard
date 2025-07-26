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

const handleImageUpload = withPermission(
	[Permission.CreateStoreItems, Permission.UpdateStoreItems],
	async (req: NextRequest, context, user) => {
		try {
			// Parse form data
			const formData = await req.formData();
			const files = formData.getAll("files") as File[];

			if (!files || files.length === 0) {
				return NextResponse.json(
					{ error: "No files provided" },
					{ status: 400 }
				);
			}

			// Validate files
			const maxFileSize = 5 * 1024 * 1024; // 5MB
			const allowedTypes = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/webp",
			];

			const uploadPromises = files.map(async (file) => {
				// Validate file type
				if (!allowedTypes.includes(file.type)) {
					throw new Error(
						`Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.`
					);
				}

				// Validate file size
				if (file.size > maxFileSize) {
					throw new Error(`File ${file.name} exceeds 5MB limit.`);
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
				console.log("supabase", supabase);
				const { data, error } = await supabase.storage
					.from("product-images")
					.upload(fileName, bytes, {
						cacheControl: "3600",
						upsert: false,
						contentType: file.type,
					});

				if (error) {
					console.error("Storage upload error:", error);
					throw new Error(`Failed to upload ${file.name}: ${error.message}`);
				}

				// Get public URL
				const {
					data: { publicUrl },
				} = supabase.storage.from("product-images").getPublicUrl(fileName);

				return {
					filename: file.name,
					url: publicUrl,
					size: file.size,
					type: file.type,
				};
			});

			const uploadedFiles = await Promise.all(uploadPromises);

			return NextResponse.json(
				{
					data: uploadedFiles,
					message: `${uploadedFiles.length} file(s) uploaded successfully`,
				},
				{ status: 200 }
			);
		} catch (error) {
			console.error("Image upload error:", error);
			return NextResponse.json(
				{
					error:
						error instanceof Error ? error.message : "Failed to upload images",
				},
				{ status: 500 }
			);
		}
	}
);

export const POST = handleImageUpload;
