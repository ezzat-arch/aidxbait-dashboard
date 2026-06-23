import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PUT /api/protected/specialties/[id]
 * Body: any of { name, name_ar, is_active }
 */
export const PUT = withPermission(
	[Permission.UpdateSpecialties],
	async (req: NextRequest, context) => {
		const { id } = await context.params;
		if (!Number(id)) {
			return NextResponse.json(
				{ error: "Invalid specialty id" },
				{ status: 400 }
			);
		}

		const body = await req.json().catch(() => ({}));
		const updates: Record<string, unknown> = {};

		if (body.name !== undefined) {
			const name = String(body.name).trim();
			if (!name) {
				return NextResponse.json(
					{ error: "name cannot be empty" },
					{ status: 400 }
				);
			}
			updates.name = name;
		}
		if (body.name_ar !== undefined) {
			updates.name_ar = body.name_ar ? String(body.name_ar).trim() : null;
		}
		if (body.is_active !== undefined) {
			updates.is_active = Boolean(body.is_active);
		}

		if (Object.keys(updates).length === 0) {
			return NextResponse.json(
				{ error: "No fields to update provided" },
				{ status: 400 }
			);
		}

		const { data, error } = await supabaseAdmin
			.from("specialties")
			.update(updates)
			.eq("id", id)
			.select("id, name")
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Specialty not found" },
					{ status: 404 }
				);
			}
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

/**
 * DELETE /api/protected/specialties/[id]
 *
 * Blocked (409) while therapists have it or requests reference it. Consider
 * setting is_active = false instead to hide it without losing history.
 */
export const DELETE = withPermission(
	[Permission.DeleteSpecialties],
	async (_req: NextRequest, context) => {
		const { id } = await context.params;
		if (!Number(id)) {
			return NextResponse.json(
				{ error: "Invalid specialty id" },
				{ status: 400 }
			);
		}

		const [{ count: therapistCount }, { count: requestCount }] =
			await Promise.all([
				supabaseAdmin
					.from("therapists")
					.select("id", { count: "exact", head: true })
					.eq("specialty_id", id),
				supabaseAdmin
					.from("requests")
					.select("id", { count: "exact", head: true })
					.eq("specialty_id", id),
			]);

		if ((therapistCount || 0) > 0 || (requestCount || 0) > 0) {
			return NextResponse.json(
				{
					error: `Cannot delete: ${therapistCount || 0} therapist(s) use this specialty and ${requestCount || 0} request(s) reference it. Set it inactive instead, or reassign those first.`,
				},
				{ status: 409 }
			);
		}

		const { error } = await supabaseAdmin
			.from("specialties")
			.delete()
			.eq("id", id);

		if (error) {
			if (error.code === "23503") {
				return NextResponse.json(
					{ error: "This specialty is referenced by other records and cannot be deleted." },
					{ status: 409 }
				);
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	}
);
