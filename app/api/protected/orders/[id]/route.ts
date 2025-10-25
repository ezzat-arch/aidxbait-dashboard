import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { OrderStatus } from "@/types/order-types";

export const GET = withPermission(
	[Permission.ViewOrderDetails],
	async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
		const supabase = await createClient();
		const { id } = await params;

		try {
			// Fetch order with full details
			const { data: order, error } = await supabase
				.from("orders")
				.select(
					`
					*,
					patient:patients!patient_id (
						id,
						user_id
					),
					shipping_address:patient_addresses!shipping_address_id (
						*
					),
					billing_address:patient_addresses!billing_address_id (
						*
					),
					order_items (
						*,
						product:products (
							id,
							name,
							product_images!product_id (
								image_url,
								is_main
							)
						)
					),
					cancelled_by_user:users!cancelled_by (
						first_name,
						last_name
					)
				`
				)
				.eq("id", id)
				.eq("soft_deleted", false)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Order not found" },
						{ status: 404 }
					);
				}
				console.error("Error fetching order details:", error);
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			// Fetch patient's user data separately
			let patientUserData = null;
			if (order.patient?.user_id) {
				const { data: userData } = await supabase
					.from("users")
					.select("first_name, last_name, phone_number, email, image_url")
					.eq("id", order.patient.user_id)
					.single();
				patientUserData = userData;
			}

			// Transform the data to flatten patient info and extract product images
			const transformedOrder = {
				...order,
				patient: {
					id: order.patient?.id,
					user_id: order.patient?.user_id,
					first_name: patientUserData?.first_name,
					last_name: patientUserData?.last_name,
					phone_number: patientUserData?.phone_number,
					email: patientUserData?.email,
					image_url: patientUserData?.image_url,
				},
				order_items: order.order_items?.map((item: any) => {
					// Extract the main image or first image from product_images array
					const productImages = item.product?.product_images || [];
					const mainImage = productImages.find((img: any) => img.is_main);
					const imageUrl =
						mainImage?.image_url || productImages[0]?.image_url || null;

					return {
						...item,
						product: {
							id: item.product?.id,
							name: item.product?.name,
							image_url: imageUrl,
						},
					};
				}),
				items_count: order.order_items?.length || 0,
			};

			return NextResponse.json({ data: transformedOrder });
		} catch (err) {
			console.error("Unexpected error fetching order details:", err);
			return NextResponse.json(
				{ error: "An unexpected error occurred" },
				{ status: 500 }
			);
		}
	}
);

export const PUT = withPermission(
	[Permission.UpdateOrderStatus],
	async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
		const supabase = await createClient();
		const { id } = await params;

		try {
			const body = await req.json();
			const { order_status } = body;

			// Validate order_status
			if (!order_status || !Object.values(OrderStatus).includes(order_status)) {
				return NextResponse.json(
					{ error: "Invalid order status" },
					{ status: 400 }
				);
			}

			// Update order status
			const { data, error } = await supabase
				.from("orders")
				.update({
					order_status,
					updated_at: new Date().toISOString(),
					// If status is delivered, set delivery_date
					...(order_status === OrderStatus.Delivered && {
						delivery_date: new Date().toISOString(),
					}),
				})
				.eq("id", id)
				.eq("soft_deleted", false)
				.select()
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Order not found" },
						{ status: 404 }
					);
				}
				console.error("Error updating order status:", error);
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json({ data });
		} catch (err) {
			console.error("Unexpected error updating order:", err);
			return NextResponse.json(
				{ error: "An unexpected error occurred" },
				{ status: 500 }
			);
		}
	}
);
