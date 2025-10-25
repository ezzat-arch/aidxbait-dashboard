import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

export const GET = withPermission(
	[Permission.ViewOrders],
	async (req: NextRequest) => {
		const supabase = await createClient();

		// Get query parameters
		const { searchParams } = new URL(req.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search") || "";
		const orderStatus =
			searchParams.get("order_status")?.split(",").filter(Boolean) || [];
		const paymentStatus =
			searchParams.get("payment_status")?.split(",").filter(Boolean) || [];
		const paymentMethod =
			searchParams.get("payment_method")?.split(",").filter(Boolean) || [];
		const orderType =
			searchParams.get("order_type")?.split(",").filter(Boolean) || [];
		const dateFrom = searchParams.get("date_from") || "";
		const dateTo = searchParams.get("date_to") || "";

		// Calculate pagination
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		try {
			// Build base query with joins
			let query = supabase
				.from("orders")
				.select(
					`
					*,
					patient:patients!patient_id (
						id,
						user_id
					),
					order_items (
						id
					)
				`,
					{ count: "exact" }
				)
				.eq("soft_deleted", false);

			// Apply search filter (patient name, order ID, or paymob IDs)
			if (search) {
				// For order ID search (numeric)
				const numericSearch = Number.parseInt(search);
				if (!Number.isNaN(numericSearch)) {
					query = query.eq("id", numericSearch);
				} else {
					// For paymob IDs or patient name search
					query = query.or(
						`paymob_order_id.ilike.%${search}%,paymob_transaction_id.ilike.%${search}%,paymob_payment_key.ilike.%${search}%`
					);
				}
			}

			// Apply status filters
			if (orderStatus.length > 0) {
				query = query.in("order_status", orderStatus);
			}

			if (paymentStatus.length > 0) {
				query = query.in("payment_status", paymentStatus);
			}

			if (paymentMethod.length > 0) {
				query = query.in("payment_method", paymentMethod);
			}

			if (orderType.length > 0) {
				query = query.in("order_type", orderType);
			}

			// Apply date range filters
			if (dateFrom) {
				query = query.gte("order_date", dateFrom);
			}

			if (dateTo) {
				// Add one day to include the entire end date
				const endDate = new Date(dateTo);
				endDate.setDate(endDate.getDate() + 1);
				query = query.lt("order_date", endDate.toISOString());
			}

			// Order by most recent first
			query = query.order("order_date", { ascending: false });

			// Apply pagination
			query = query.range(from, to);

			// Execute query
			const { data, error, count } = await query;

			if (error) {
				console.error("Error fetching orders:", error);
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			// Get unique user IDs from patients
			const userIds = [
				...new Set(
					data?.map((order: any) => order.patient?.user_id).filter(Boolean)
				),
			];

			// Fetch all user data in one query
			const { data: usersData } = await supabase
				.from("users")
				.select("id, first_name, last_name, phone_number, email, image_url")
				.in("id", userIds);

			// Create a map of user data for quick lookup
			const usersMap = new Map(
				usersData?.map((user: any) => [user.id, user]) || []
			);

			// Transform data to flatten patient info and add items count
			const transformedData = data?.map((order: any) => {
				const userData = usersMap.get(order.patient?.user_id);
				return {
					...order,
					patient: {
						id: order.patient?.id,
						user_id: order.patient?.user_id,
						first_name: userData?.first_name,
						last_name: userData?.last_name,
						phone_number: userData?.phone_number,
						email: userData?.email,
						image_url: userData?.image_url,
					},
					items_count: order.order_items?.length || 0,
					order_items: undefined, // Remove the full items array for list view
				};
			});

			return NextResponse.json({
				data: transformedData,
				meta: {
					total: count || 0,
					page,
					limit,
					totalPages: count ? Math.ceil(count / limit) : 0,
				},
			});
		} catch (err) {
			console.error("Unexpected error fetching orders:", err);
			return NextResponse.json(
				{ error: "An unexpected error occurred" },
				{ status: 500 }
			);
		}
	}
);
