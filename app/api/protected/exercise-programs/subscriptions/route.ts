import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetSubscriptions = withPermission(
	[Permission.ViewSubscriptions],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const { searchParams } = new URL(req.url);

			// Parse query parameters
			const page = parseInt(searchParams.get("page") || "1");
			const limit = parseInt(searchParams.get("limit") || "10");
			const search = searchParams.get("search") || "";
			const status = searchParams.get("status") || "all";
			const paymentStatus = searchParams.get("payment_status") || "";
			const paymentMethod = searchParams.get("payment_method") || "";

			const offset = (page - 1) * limit;

			// Build query
			let query = supabase
				.from("exercise_program_subscriptions")
				.select(
					`
					*,
					patient:patients(id, name, email, phone),
					program:programs(id, name, description, price, currency, duration_days),
					payment:payments(id, amount, currency, payment_method, status, transaction_id)
				`
				)
				.order("created_at", { ascending: false });

			// Apply filters
			if (status === "active") {
				query = query.eq("is_active", true).eq("is_cancelled", false);
			} else if (status === "cancelled") {
				query = query.eq("is_cancelled", true);
			}

			if (paymentStatus) {
				query = query.eq("payment.status", paymentStatus);
			}

			if (paymentMethod) {
				query = query.eq("payment.payment_method", paymentMethod);
			}

			// Apply search if provided
			if (search) {
				query = query.or(`
					patient.name.ilike.%${search}%,
					patient.email.ilike.%${search}%,
					program.name.ilike.%${search}%
				`);
			}

			// Get total count
			const { count } = await supabase
				.from("exercise_program_subscriptions")
				.select("*", { count: "exact", head: true });

			// Apply pagination
			query = query.range(offset, offset + limit - 1);

			const { data: subscriptions, error } = await query;

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch subscriptions" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: subscriptions || [],
				meta: {
					total: count || 0,
					page,
					limit,
					totalPages: Math.ceil((count || 0) / limit),
				},
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

const handleCreateSubscription = withPermission(
	[Permission.CreateSubscriptions],
	async (req, context, user) => {
		try {
			const supabase = await createClient();
			const body = await req.json();

			// Basic validation
			if (!body.patient_id || !body.program_id || !body.payment_id) {
				return NextResponse.json(
					{ error: "Patient ID, Program ID, and Payment ID are required" },
					{ status: 400 }
				);
			}

			// Validate that the patient, program, and payment exist
			const { data: patient } = await supabase
				.from("patients")
				.select("id")
				.eq("id", body.patient_id)
				.single();

			if (!patient) {
				return NextResponse.json(
					{ error: "Patient not found" },
					{ status: 404 }
				);
			}

			const { data: program } = await supabase
				.from("programs")
				.select("id, duration_days")
				.eq("id", body.program_id)
				.single();

			if (!program) {
				return NextResponse.json(
					{ error: "Program not found" },
					{ status: 404 }
				);
			}

			const { data: payment } = await supabase
				.from("payments")
				.select("id")
				.eq("id", body.payment_id)
				.single();

			if (!payment) {
				return NextResponse.json(
					{ error: "Payment not found" },
					{ status: 404 }
				);
			}

			// Calculate end date if not provided
			const startDate = new Date(body.start_date || new Date());
			const endDate = body.end_date
				? new Date(body.end_date)
				: new Date(
						startDate.getTime() + program.duration_days * 24 * 60 * 60 * 1000
				  );

			// Create subscription
			const { data: subscription, error } = await supabase
				.from("exercise_program_subscriptions")
				.insert({
					patient_id: parseInt(body.patient_id),
					program_id: parseInt(body.program_id),
					payment_id: parseInt(body.payment_id),
					start_date: startDate.toISOString(),
					end_date: endDate.toISOString(),
					is_active: body.is_active !== false,
					is_cancelled: false,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
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

				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A subscription with this combination already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to create subscription" },
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ data: subscription, message: "Subscription created successfully" },
				{ status: 201 }
			);
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

export const GET = handleGetSubscriptions;
export const POST = handleCreateSubscription;
