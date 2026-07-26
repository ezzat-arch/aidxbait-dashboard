import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type {
	ShopifyMoney,
	ShopifyOrderAddress,
	ShopifyOrderDetail,
	ShopifyOrderLineItem,
} from "@/types/shopify-order-types";

const ORDER_QUERY = `
	query getOrder($id: ID!) {
		order(id: $id) {
			id legacyResourceId name createdAt processedAt cancelledAt closedAt note tags
			displayFinancialStatus displayFulfillmentStatus
			subtotalLineItemsQuantity
			totalPriceSet { shopMoney { amount currencyCode } }
			subtotalPriceSet { shopMoney { amount currencyCode } }
			totalShippingPriceSet { shopMoney { amount currencyCode } }
			totalTaxSet { shopMoney { amount currencyCode } }
			totalDiscountsSet { shopMoney { amount currencyCode } }
			customer { displayName email phone }
			shippingAddress { name address1 address2 city province country zip phone }
			billingAddress { name address1 address2 city province country zip phone }
			lineItems(first: 100) { edges { node {
				title quantity sku variantTitle
				originalUnitPriceSet { shopMoney { amount currencyCode } }
				discountedTotalSet { shopMoney { amount currencyCode } }
				image { url }
			} } }
			fulfillments(first: 10) { trackingInfo(first: 10) { number url company } }
		}
	}
`;

type ShopifyMoneySet = {
	shopMoney?: { amount?: string; currencyCode?: string };
} | null;

const mapMoney = (set: ShopifyMoneySet | undefined): ShopifyMoney | null =>
	set?.shopMoney?.amount != null
		? {
				amount: set.shopMoney.amount,
				currency_code: set.shopMoney.currencyCode ?? "USD",
			}
		: null;

const mapAddress = (address: any): ShopifyOrderAddress | null =>
	address
		? {
				name: address.name ?? null,
				address1: address.address1 ?? null,
				address2: address.address2 ?? null,
				city: address.city ?? null,
				province: address.province ?? null,
				country: address.country ?? null,
				zip: address.zip ?? null,
				phone: address.phone ?? null,
			}
		: null;

/**
 * GET /api/protected/shopify-orders/[id]
 *
 * Full details for a single Shopify order. `id` is the numeric legacy id
 * (used in Shopify admin URLs), converted to a gid for the Admin API.
 */
export const GET = withPermission(
	[Permission.ViewOrderDetails],
	async (_req: NextRequest, context) => {
		const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
		const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
		if (!domain || !token) {
			return NextResponse.json(
				{
					error:
						"Shopify Admin API is not configured. Create a custom app in Shopify admin (read_orders + read_customers) and set SHOPIFY_ADMIN_ACCESS_TOKEN in the dashboard env - the public storefront token cannot read orders.",
				},
				{ status: 500 }
			);
		}

		const { id } = await context.params;
		if (!/^\d+$/.test(id)) {
			return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
		}

		try {
			const result = await fetch(
				`https://${domain}/admin/api/2024-04/graphql.json`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Shopify-Access-Token": token,
					},
					body: JSON.stringify({
						query: ORDER_QUERY,
						variables: { id: `gid://shopify/Order/${id}` },
					}),
					cache: "no-store",
				}
			);

			if (result.status === 401 || result.status === 403) {
				return NextResponse.json(
					{
						error:
							"Shopify rejected the token (401/403). SHOPIFY_ADMIN_ACCESS_TOKEN must be an Admin API access token (shpat_...) from a custom app with the read_orders scope - the storefront token will not work.",
					},
					{ status: 502 }
				);
			}

			const body = await result.json();

			if (body.errors?.length) {
				console.error("Shopify order fetch error:", body.errors);
				return NextResponse.json(
					{ error: `Shopify GraphQL error: ${body.errors[0].message}` },
					{ status: 502 }
				);
			}

			if (!result.ok) {
				console.error("Shopify order fetch error:", `HTTP ${result.status}`);
				return NextResponse.json(
					{ error: "Failed to fetch order from Shopify" },
					{ status: 502 }
				);
			}

			const order = body.data?.order;
			if (!order) {
				return NextResponse.json({ error: "Order not found" }, { status: 404 });
			}

			const storeHandle = domain.replace(".myshopify.com", "");

			const line_items: ShopifyOrderLineItem[] = (
				order.lineItems?.edges ?? []
			).map(({ node }: { node: any }) => ({
				title: node.title,
				variant_title: node.variantTitle ?? null,
				sku: node.sku ?? null,
				quantity: node.quantity ?? 0,
				unit_price: mapMoney(node.originalUnitPriceSet),
				line_total: mapMoney(node.discountedTotalSet),
				image_url: node.image?.url ?? null,
			}));

			const tracking = (order.fulfillments ?? []).flatMap(
				(fulfillment: any) =>
					(fulfillment.trackingInfo ?? []).map((info: any) => ({
						number: info.number ?? null,
						url: info.url ?? null,
						company: info.company ?? null,
					}))
			);

			const data: ShopifyOrderDetail = {
				id: order.id,
				legacy_id: String(order.legacyResourceId),
				name: order.name,
				created_at: order.createdAt,
				processed_at: order.processedAt ?? null,
				cancelled_at: order.cancelledAt ?? null,
				closed_at: order.closedAt ?? null,
				note: order.note ?? null,
				tags: order.tags ?? [],
				financial_status: order.displayFinancialStatus ?? null,
				fulfillment_status: order.displayFulfillmentStatus ?? null,
				total: mapMoney(order.totalPriceSet) ?? {
					amount: "0",
					currency_code: "USD",
				},
				subtotal: mapMoney(order.subtotalPriceSet),
				total_shipping: mapMoney(order.totalShippingPriceSet),
				total_tax: mapMoney(order.totalTaxSet),
				total_discounts: mapMoney(order.totalDiscountsSet),
				customer_name: order.customer?.displayName ?? null,
				customer_email: order.customer?.email ?? null,
				customer_phone: order.customer?.phone ?? null,
				item_count: order.subtotalLineItemsQuantity ?? 0,
				shipping_address: mapAddress(order.shippingAddress),
				billing_address: mapAddress(order.billingAddress),
				line_items,
				tracking,
				admin_url: `https://admin.shopify.com/store/${storeHandle}/orders/${order.legacyResourceId}`,
			};

			return NextResponse.json({ data });
		} catch (error) {
			console.error("Shopify order fetch error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch order from Shopify" },
				{ status: 502 }
			);
		}
	}
);
