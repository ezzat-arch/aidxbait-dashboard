import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PUT /api/protected/therapists/[id]/approve
 *
 * Approve a therapist application: sets account_status = 'approved' and stamps
 * the reviewing admin. After this the therapist can receive patient requests.
 */
export const PUT = withPermission(
	[Permission.ApproveTherapists],
	async (_req: NextRequest, context, user) => {
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "Therapist ID is required" },
				{ status: 400 }
			);
		}

		// reviewed_by references admins(id); resolve it from the acting user.
		const { data: admin } = await supabaseAdmin
			.from("admins")
			.select("id")
			.eq("user_id", user.id)
			.maybeSingle();

		const { data, error } = await supabaseAdmin
			.from("therapists")
			.update({
				account_status: "approved",
				rejection_reason: null,
				reviewed_by: admin?.id ?? null,
				reviewed_at: new Date().toISOString(),
			})
			.eq("id", id)
			.select("id, account_status")
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

		return NextResponse.json({ success: true, data });
	}
);
