import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PUT /api/protected/locations/[id]
 *
 * Update a service area. Body: any of
 * { location_name, latitude, longitude, latitude_delta, longitude_delta }
 */
export const PUT = withPermission(
	[Permission.UpdateLocations],
	async (req: NextRequest, context) => {
		const { id } = await context.params;
		if (!Number(id)) {
			return NextResponse.json({ error: "Invalid location id" }, { status: 400 });
		}

		const body = await req.json().catch(() => ({}));
		const updates: Record<string, unknown> = {};

		if (body.location_name !== undefined) {
			const name = String(body.location_name).trim();
			if (!name) {
				return NextResponse.json(
					{ error: "location_name cannot be empty" },
					{ status: 400 }
				);
			}
			updates.location_name = name;
		}
		for (const field of [
			"latitude",
			"longitude",
			"latitude_delta",
			"longitude_delta",
		] as const) {
			if (body[field] !== undefined) {
				const value = Number(body[field]);
				if (Number.isNaN(value)) {
					return NextResponse.json(
						{ error: `${field} must be a number` },
						{ status: 400 }
					);
				}
				updates[field] = value;
			}
		}

		if (Object.keys(updates).length === 0) {
			return NextResponse.json(
				{ error: "No fields to update provided" },
				{ status: 400 }
			);
		}

		const { data, error } = await supabaseAdmin
			.from("locations")
			.update(updates)
			.eq("id", id)
			.select("id, location_name")
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Service area not found" },
					{ status: 404 }
				);
			}
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

/**
 * DELETE /api/protected/locations/[id]
 *
 * Delete a service area. Blocked (409) while therapists cover it or
 * requests reference it, so existing data is never orphaned.
 */
export const DELETE = withPermission(
	[Permission.DeleteLocations],
	async (_req: NextRequest, context) => {
		const { id } = await context.params;
		if (!Number(id)) {
			return NextResponse.json({ error: "Invalid location id" }, { status: 400 });
		}

		// Friendly pre-checks (the FKs would block anyway, with an ugly error)
		const [{ count: therapistCount }, { count: requestCount }] =
			await Promise.all([
				supabaseAdmin
					.from("therapist_locations")
					.select("id", { count: "exact", head: true })
					.eq("location_id", id),
				supabaseAdmin
					.from("requests")
					.select("id", { count: "exact", head: true })
					.eq("location_id", id),
			]);

		if ((therapistCount || 0) > 0 || (requestCount || 0) > 0) {
			return NextResponse.json(
				{
					error: `Cannot delete: ${therapistCount || 0} therapist(s) cover this area and ${requestCount || 0} request(s) reference it. Remove those first.`,
				},
				{ status: 409 }
			);
		}

		const { error } = await supabaseAdmin
			.from("locations")
			.delete()
			.eq("id", id);

		if (error) {
			if (error.code === "23503") {
				return NextResponse.json(
					{ error: "This service area is referenced by other records and cannot be deleted." },
					{ status: 409 }
				);
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	}
);
