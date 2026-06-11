import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PUT /api/protected/therapists/[id]/decline
 *
 * Decline a therapist application: sets account_status = 'rejected' and stores
 * the reason (shown to the therapist in the app). Body: { reason: string }
 */
export const PUT = withPermission(
	[Permission.DeclineTherapists],
	async (req: NextRequest, context, user) => {
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "Therapist ID is required" },
				{ status: 400 }
			);
		}

		let reason = "";
		try {
			const body = await req.json();
			reason = (body?.reason || "").trim();
		} catch {
			// no body
		}

		if (!reason) {
			return NextResponse.json(
				{ error: "A reason is required to decline an application" },
				{ status: 400 }
			);
		}

		const { data: admin } = await supabaseAdmin
			.from("admins")
			.select("id")
			.eq("user_id", user.id)
			.maybeSingle();

		const { data, error } = await supabaseAdmin
			.from("therapists")
			.update({
				account_status: "rejected",
				rejection_reason: reason,
				reviewed_by: admin?.id ?? null,
				reviewed_at: new Date().toISOString(),
			})
			.eq("id", id)
			.select("id, account_status, rejection_reason")
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
