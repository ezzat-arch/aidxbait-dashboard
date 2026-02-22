import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetSubscription = withPermission(
	[Permission.ViewSubscriptions],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const { id } = await context.params;

			if (!id) {
				return NextResponse.json(
					{ error: "Subscription ID is required" },
					{ status: 400 }
				);
			}

			const { data: subscription, error } = await supabase
				.from("exercise_program_subscriptions")
				.select(
					`
					*,
					patient:patients(id, name, email, phone),
					program:programs(id, name, description, price, currency, duration_days),
					payment:payments(id, amount, currency, payment_method, status, transaction_id)
				`
				)
				.eq("id", id)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch subscription" },
					{ status: 500 }
				);
			}

			if (!subscription) {
				return NextResponse.json(
					{ error: "Subscription not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json({ data: subscription });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateSubscription = withPermission(
	[Permission.UpdateSubscriptions],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const { id } = await context.params;
			const body = await req.json();

			if (!id) {
				return NextResponse.json(
					{ error: "Subscription ID is required" },
					{ status: 400 }
				);
			}

			// Check if subscription exists
			const { data: existingSubscription } = await supabase
				.from("exercise_program_subscriptions")
				.select("id")
				.eq("id", id)
				.single();

			if (!existingSubscription) {
				return NextResponse.json(
					{ error: "Subscription not found" },
					{ status: 404 }
				);
			}

			// Build update object
			const updateData: any = {
				updated_at: new Date().toISOString(),
			};

			if (body.start_date)
				updateData.start_date = new Date(body.start_date).toISOString();
			if (body.end_date)
				updateData.end_date = new Date(body.end_date).toISOString();
			if (body.is_active !== undefined) updateData.is_active = body.is_active;

			// Update subscription
			const { data: subscription, error } = await supabase
				.from("exercise_program_subscriptions")
				.update(updateData)
				.eq("id", id)
				.select(
					`
					*,
					patient:patients(id, name, email, phone),
					program:programs(id, name, description, price, currency, duration_days),
					payment:payments(id, amount, currency, payment_method, status, transaction_id)
				`
				)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to update subscription" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: subscription,
				message: "Subscription updated successfully",
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleCancelSubscription = withPermission(
	[Permission.CancelSubscriptions],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const { id } = await context.params;
			const body = await req.json();

			if (!id) {
				return NextResponse.json(
					{ error: "Subscription ID is required" },
					{ status: 400 }
				);
			}

			if (!body.cancellation_reason) {
				return NextResponse.json(
					{ error: "Cancellation reason is required" },
					{ status: 400 }
				);
			}

			// Check if subscription exists and is not already cancelled
			const { data: existingSubscription } = await supabase
				.from("exercise_program_subscriptions")
				.select("id, is_cancelled")
				.eq("id", id)
				.single();

			if (!existingSubscription) {
				return NextResponse.json(
					{ error: "Subscription not found" },
					{ status: 404 }
				);
			}

			if (existingSubscription.is_cancelled) {
				return NextResponse.json(
					{ error: "Subscription is already cancelled" },
					{ status: 400 }
				);
			}

			// Cancel subscription
			const { data: subscription, error } = await supabase
				.from("exercise_program_subscriptions")
				.update({
					is_cancelled: true,
					is_active: false,
					cancelled_at: new Date().toISOString(),
					cancellation_reason: body.cancellation_reason.trim(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select(
					`
					*,
					patient:patients(id, name, email, phone),
					program:programs(id, name, description, price, currency, duration_days),
					payment:payments(id, amount, currency, payment_method, status, transaction_id)
				`
				)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to cancel subscription" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: subscription,
				message: "Subscription cancelled successfully",
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

export const GET = handleGetSubscription;
export const PUT = handleUpdateSubscription;
export const DELETE = handleCancelSubscription;
