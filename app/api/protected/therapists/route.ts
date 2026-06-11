import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/protected/therapists
 *
 * List therapist applications/accounts joined with their user row, document
 * count, and covered areas. Supports search + status filter + pagination.
 *
 * Query params: page, limit, search, status (account_status value)
 *
 * Uses the service-role client because therapist tables have RLS enabled with
 * no anon policies; admin access is already enforced by withPermission.
 */
export const GET = withPermission(
	[Permission.ViewTherapists],
	async (req: NextRequest) => {
		const { searchParams } = new URL(req.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search")?.trim() || "";
		const status = searchParams.get("status") || "";

		const from = (page - 1) * limit;
		const to = from + limit - 1;

		// Join therapists -> users so we can search/show name, email, phone.
		let query = supabaseAdmin
			.from("therapists")
			.select(
				`
				id,
				account_status,
				specialty,
				bio,
				gender,
				experience_years,
				rejection_reason,
				is_available,
				created_at,
				updated_at,
				users:user_id ( id, first_name, last_name, email, phone_number, image_url )
				`,
				{ count: "exact" }
			)
			.order("created_at", { ascending: false });

		if (status) {
			query = query.eq("account_status", status);
		}

		query = query.range(from, to);

		const { data, error, count } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Flatten the users join and apply the (in-memory) text search on the
		// joined fields. The page is small (<= limit), so this is cheap.
		type UserJoin = {
			id: number;
			first_name: string | null;
			last_name: string | null;
			email: string | null;
			phone_number: string | null;
			image_url: string | null;
		};
		type Row = {
			id: number;
			account_status: string;
			specialty: string | null;
			bio: string | null;
			gender: string | null;
			experience_years: number | null;
			rejection_reason: string | null;
			is_available: boolean;
			created_at: string;
			users: UserJoin | UserJoin[] | null;
		};

		const rawRows = (data ?? []) as unknown as Row[];
		const userOf = (r: Row): UserJoin | null =>
			Array.isArray(r.users) ? r.users[0] ?? null : r.users;

		const therapistIds = rawRows.map((r) => r.id);

		// Document counts per therapist (single grouped fetch).
		const docCounts: Record<number, number> = {};
		const areaNames: Record<number, string[]> = {};
		if (therapistIds.length > 0) {
			const { data: docs } = await supabaseAdmin
				.from("therapist_documents")
				.select("therapist_id")
				.in("therapist_id", therapistIds)
				.eq("is_deleted", false);
			for (const d of docs ?? []) {
				docCounts[d.therapist_id] = (docCounts[d.therapist_id] || 0) + 1;
			}

			const { data: areas } = await supabaseAdmin
				.from("therapist_locations")
				.select("therapist_id, locations:location_id ( location_name )")
				.in("therapist_id", therapistIds);
			for (const a of (areas ?? []) as unknown as {
				therapist_id: number;
				locations: { location_name: string } | { location_name: string }[] | null;
			}[]) {
				if (!areaNames[a.therapist_id]) areaNames[a.therapist_id] = [];
				const loc = Array.isArray(a.locations) ? a.locations[0] : a.locations;
				if (loc?.location_name)
					areaNames[a.therapist_id].push(loc.location_name);
			}
		}

		let rows = rawRows.map((r) => {
			const u = userOf(r);
			return {
				id: r.id,
				account_status: r.account_status,
				specialty: r.specialty,
				bio: r.bio,
				gender: r.gender,
				experience_years: r.experience_years,
				rejection_reason: r.rejection_reason,
				is_available: r.is_available,
				created_at: r.created_at,
				user_id: u?.id ?? null,
				first_name: u?.first_name ?? null,
				last_name: u?.last_name ?? null,
				email: u?.email ?? null,
				phone_number: u?.phone_number ?? null,
				image_url: u?.image_url ?? null,
				document_count: docCounts[r.id] || 0,
				areas: areaNames[r.id] || [],
			};
		});

		if (search) {
			const q = search.toLowerCase();
			rows = rows.filter((r) =>
				[r.first_name, r.last_name, r.email, r.phone_number, r.specialty]
					.filter(Boolean)
					.some((v) => String(v).toLowerCase().includes(q))
			);
		}

		return NextResponse.json({
			data: rows,
			meta: {
				total: count || 0,
				page,
				limit,
				totalPages: count ? Math.ceil(count / limit) : 0,
			},
		});
	}
);
