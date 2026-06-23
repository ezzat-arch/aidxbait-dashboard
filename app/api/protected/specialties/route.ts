import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/protected/specialties
 *
 * List specialties with search + pagination, plus how many therapists have
 * each one (informs whether a delete will be blocked).
 * Query params: page, limit, search
 */
export const GET = withPermission(
	[Permission.ViewSpecialties],
	async (req: NextRequest) => {
		const { searchParams } = new URL(req.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search")?.trim() || "";

		const from = (page - 1) * limit;
		const to = from + limit - 1;

		let query = supabaseAdmin
			.from("specialties")
			.select("id, name, name_ar, is_active, created_at", { count: "exact" })
			.order("name");

		if (search) {
			query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`);
		}

		const { data, error, count } = await query.range(from, to);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Therapist counts per specialty on this page
		const ids = (data ?? []).map((s) => s.id);
		const therapistCounts: Record<number, number> = {};
		if (ids.length > 0) {
			const { data: therapists } = await supabaseAdmin
				.from("therapists")
				.select("specialty_id")
				.in("specialty_id", ids);
			for (const t of therapists ?? []) {
				if (t.specialty_id != null) {
					therapistCounts[t.specialty_id] =
						(therapistCounts[t.specialty_id] || 0) + 1;
				}
			}
		}

		const rows = (data ?? []).map((s) => ({
			...s,
			therapist_count: therapistCounts[s.id] || 0,
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
 * POST /api/protected/specialties
 *
 * Create a specialty. Body: { name, name_ar?, is_active? }
 */
export const POST = withPermission(
	[Permission.CreateSpecialties],
	async (req: NextRequest) => {
		const body = await req.json().catch(() => ({}));
		const name = String(body.name ?? "").trim();
		if (!name) {
			return NextResponse.json({ error: "name is required" }, { status: 400 });
		}

		const { data, error } = await supabaseAdmin
			.from("specialties")
			.insert([
				{
					name,
					name_ar: body.name_ar ? String(body.name_ar).trim() : null,
					is_active: body.is_active === undefined ? true : Boolean(body.is_active),
				},
			])
			.select("id, name")
			.single();

		if (error) {
			if (error.code === "23505") {
				return NextResponse.json(
					{ error: "A specialty with this name already exists" },
					{ status: 409 }
				);
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, data });
	}
);
