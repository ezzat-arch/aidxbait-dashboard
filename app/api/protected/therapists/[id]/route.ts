import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/protected/therapists/[id]
 *
 * Full therapist record: profile, user info, covered areas, and all uploaded
 * documents (with signed URLs so the admin can open the private files).
 */
export const GET = withPermission(
	[Permission.ViewTherapists],
	async (_req: NextRequest, context) => {
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "Therapist ID is required" },
				{ status: 400 }
			);
		}

		const { data: therapist, error } = await supabaseAdmin
			.from("therapists")
			.select(
				`
				id, account_status, specialty, bio, gender, experience_years,
				rejection_reason, is_available, created_at, updated_at,
				rating_avg, rating_count,
				users:user_id ( id, first_name, last_name, email, phone_number, image_url )
				`
			)
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Therapist not found" },
					{ status: 404 }
				);
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		const { data: areas } = await supabaseAdmin
			.from("therapist_locations")
			.select("location_id, locations:location_id ( id, location_name )")
			.eq("therapist_id", id);

		const { data: documents } = await supabaseAdmin
			.from("therapist_documents")
			.select(
				"id, document_type, file_url, file_name, mime_type, size_kb, status, review_notes, created_at"
			)
			.eq("therapist_id", id)
			.eq("is_deleted", false)
			.order("created_at", { ascending: false });

		// Generate short-lived signed URLs for the private document files.
		const documentsWithUrls = await Promise.all(
			(documents ?? []).map(async (doc) => {
				const { data: signed } = await supabaseAdmin.storage
					.from("therapist-documents")
					.createSignedUrl(doc.file_url, 60 * 10); // 10 minutes
				return { ...doc, signed_url: signed?.signedUrl ?? null };
			})
		);

		// Patient reviews of this therapist (most recent first).
		const { data: reviews } = await supabaseAdmin
			.from("visit_reviews")
			.select("id, rating, comment, created_at")
			.eq("therapist_id", id)
			.order("created_at", { ascending: false })
			.limit(100);

		return NextResponse.json({
			data: {
				...therapist,
				areas: (areas ?? [])
					.map(
						(a) =>
							a.locations as unknown as { id: number; location_name: string }
					)
					.filter(Boolean),
				documents: documentsWithUrls,
				reviews: reviews ?? [],
			},
		});
	}
);
