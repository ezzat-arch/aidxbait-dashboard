import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

function validateLocationBody(body: Record<string, unknown>) {
	const name = String(body.location_name ?? "").trim();
	const latitude = Number(body.latitude);
	const longitude = Number(body.longitude);
	const latitude_delta = Number(body.latitude_delta);
	const longitude_delta = Number(body.longitude_delta);

	if (!name) return { error: "location_name is required" };
	if (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
		return { error: "latitude must be a number between -90 and 90" };
	if (Number.isNaN(longitude) || longitude < -180 || longitude > 180)
		return { error: "longitude must be a number between -180 and 180" };
	if (Number.isNaN(latitude_delta) || latitude_delta <= 0)
		return { error: "latitude_delta must be a positive number" };
	if (Number.isNaN(longitude_delta) || longitude_delta <= 0)
		return { error: "longitude_delta must be a positive number" };

	return {
		values: {
			location_name: name,
			latitude,
			longitude,
			latitude_delta,
			longitude_delta,
		},
	};
}

/**
 * GET /api/protected/locations
 *
 * List service areas with search + pagination, plus how many therapists
 * cover each one (informs whether a delete will be blocked).
 * Query params: page, limit, search
 */
export const GET = withPermission(
	[Permission.ViewLocations],
	async (req: NextRequest) => {
		const { searchParams } = new URL(req.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search")?.trim() || "";

		const from = (page - 1) * limit;
		const to = from + limit - 1;

		let query = supabaseAdmin
			.from("locations")
			.select(
				"id, location_name, latitude, longitude, latitude_delta, longitude_delta, created_at",
				{ count: "exact" }
			)
			.order("location_name");

		if (search) {
			query = query.ilike("location_name", `%${search}%`);
		}

		const { data, error, count } = await query.range(from, to);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Therapist coverage + open requests counts per location on this page
		const ids = (data ?? []).map((l) => l.id);
		const therapistCounts: Record<number, number> = {};
		const requestCounts: Record<number, number> = {};
		if (ids.length > 0) {
			const [{ data: coverage }, { data: reqs }] = await Promise.all([
				supabaseAdmin
					.from("therapist_locations")
					.select("location_id")
					.in("location_id", ids),
				supabaseAdmin
					.from("requests")
					.select("location_id")
					.in("location_id", ids)
					.eq("is_archived", false),
			]);
			for (const c of coverage ?? []) {
				therapistCounts[c.location_id] =
					(therapistCounts[c.location_id] || 0) + 1;
			}
			for (const r of reqs ?? []) {
				requestCounts[r.location_id] = (requestCounts[r.location_id] || 0) + 1;
			}
		}

		const rows = (data ?? []).map((l) => ({
			...l,
			therapist_count: therapistCounts[l.id] || 0,
			request_count: requestCounts[l.id] || 0,
		}));

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

/**
 * POST /api/protected/locations
 *
 * Create a service area.
 * Body: { location_name, latitude, longitude, latitude_delta, longitude_delta }
 */
export const POST = withPermission(
	[Permission.CreateLocations],
	async (req: NextRequest) => {
		const body = await req.json().catch(() => ({}));
		const parsed = validateLocationBody(body);
		if ("error" in parsed) {
			return NextResponse.json({ error: parsed.error }, { status: 400 });
		}

		const { data, error } = await supabaseAdmin
			.from("locations")
			.insert([parsed.values])
			.select("id, location_name")
			.single();

		if (error) {
			if (error.code === "23505") {
				return NextResponse.json(
					{ error: "A service area with this name already exists" },
					{ status: 409 }
				);
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, data });
	}
);
