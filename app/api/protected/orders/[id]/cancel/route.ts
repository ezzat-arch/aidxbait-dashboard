import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { OrderStatus } from "@/types/order-types";

export const PUT = withPermission(
	[Permission.CancelOrder],
	async (
		req: NextRequest,
		{ params }: { params: Promise<{ id: string }> },
		user
	) => {
		const supabase = await createClient();
		const { id } = await params;

		try {
			const body = await req.json();
			const { cancellation_reason } = body;

			// Validate cancellation reason
			if (!cancellation_reason || cancellation_reason.trim().length < 10) {
				return NextResponse.json(
					{ error: "Cancellation reason must be at least 10 characters" },
					{ status: 400 }
				);
			}

			// First, check if order exists and is not already cancelled
			const { data: existingOrder, error: fetchError } = await supabase
				.from("orders")
				.select("order_status")
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (fetchError) {
				if (fetchError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Order not found" },
						{ status: 404 }
					);
				}
				console.error("Error fetching order:", fetchError);
				return NextResponse.json(
					{ error: fetchError.message },
					{ status: 500 }
				);
			}

			if (existingOrder.order_status === OrderStatus.Cancelled) {
				return NextResponse.json(
					{ error: "Order is already cancelled" },
					{ status: 400 }
				);
			}

			// Get user ID from the authenticated user
			const { data: userData } = await supabase
				.from("users")
				.select("id")
				.eq("supabase_id", user.id)
				.single();

			// Update order to cancelled status
			const { data, error } = await supabase
				.from("orders")
				.update({
					order_status: OrderStatus.Cancelled,
					cancellation_reason: cancellation_reason.trim(),
					cancellation_date: new Date().toISOString(),
					cancelled_by: userData?.id || null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.eq("soft_deleted", false)
				.select()
				.single();

			if (error) {
				console.error("Error cancelling order:", error);
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json({ data });
		} catch (err) {
			console.error("Unexpected error cancelling order:", err);
			return NextResponse.json(
				{ error: "An unexpected error occurred" },
				{ status: 500 }
			);
		}
	}
);
