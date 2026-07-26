import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import type {
	ShopifyOrderRow,
	ShopifyOrdersPageInfo,
} from "@/types/shopify-order-types";

// Uses the Shopify **Admin** GraphQL API (server-side secret token) — the
// public storefront token cannot read orders (the Admin API returns 401 for
// it), hence the loud configuration errors below.
const ORDERS_QUERY = `
	query getOrders($first: Int!, $after: String, $query: String) {
		orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
			pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
			edges { node {
				id legacyResourceId name createdAt
				displayFinancialStatus displayFulfillmentStatus
				subtotalLineItemsQuantity
				totalPriceSet { shopMoney { amount currencyCode } }
				customer { displayName email }
			} }
		}
	}
`;

type ShopifyOrderNode = {
	id: string;
	legacyResourceId: string;
	name: string;
	createdAt: string;
	displayFinancialStatus?: string | null;
	displayFulfillmentStatus?: string | null;
	subtotalLineItemsQuantity?: number;
	totalPriceSet?: { shopMoney?: { amount?: string; currencyCode?: string } };
	customer?: { displayName?: string | null; email?: string | null } | null;
};

/**
 * GET /api/protected/shopify-orders?search=&financial_status=&fulfillment_status=&after=
 *
 * List Shopify orders (newest first, 20 per page, cursor pagination).
 * `search` matches order name/email using Shopify's query syntax.
 */
export const GET = withPermission(
	[Permission.ViewOrders],
	async (req: NextRequest) => {
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

		const { searchParams } = new URL(req.url);
		const search = searchParams.get("search")?.trim() || "";
		const financialStatus = searchParams.get("financial_status") || "";
		const fulfillmentStatus = searchParams.get("fulfillment_status") || "";
		const after = searchParams.get("after") || "";

		// Build a Shopify order search query (e.g. `name:#1001 AND financial_status:paid`)
		const queryParts: string[] = [];
		if (search) {
			queryParts.push(
				search.startsWith("#")
					? `name:${search}`
					: `(name:${search} OR email:${search})`
			);
		}
		if (financialStatus) queryParts.push(`financial_status:${financialStatus}`);
		if (fulfillmentStatus)
			queryParts.push(`fulfillment_status:${fulfillmentStatus}`);
		const query = queryParts.join(" AND ") || null;

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
						query: ORDERS_QUERY,
						variables: { first: 20, after: after || null, query },
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
				console.error("Shopify orders fetch error:", body.errors);
				return NextResponse.json(
					{ error: `Shopify GraphQL error: ${body.errors[0].message}` },
					{ status: 502 }
				);
			}

			if (!result.ok) {
				console.error("Shopify orders fetch error:", `HTTP ${result.status}`);
				return NextResponse.json(
					{ error: "Failed to fetch orders from Shopify" },
					{ status: 502 }
				);
			}

			const storeHandle = domain.replace(".myshopify.com", "");
			const edges = (body.data?.orders?.edges ?? []) as {
				node: ShopifyOrderNode;
			}[];
			const data: ShopifyOrderRow[] = edges.map(({ node }) => ({
				id: node.id,
				legacy_id: String(node.legacyResourceId),
				name: node.name,
				created_at: node.createdAt,
				financial_status: node.displayFinancialStatus ?? null,
				fulfillment_status: node.displayFulfillmentStatus ?? null,
				total: {
					amount: node.totalPriceSet?.shopMoney?.amount ?? "0",
					currency_code: node.totalPriceSet?.shopMoney?.currencyCode ?? "USD",
				},
				customer_name: node.customer?.displayName ?? null,
				customer_email: node.customer?.email ?? null,
				item_count: node.subtotalLineItemsQuantity ?? 0,
				admin_url: `https://admin.shopify.com/store/${storeHandle}/orders/${node.legacyResourceId}`,
			}));

			const rawPageInfo = body.data?.orders?.pageInfo ?? {};
			const pageInfo: ShopifyOrdersPageInfo = {
				has_next: rawPageInfo.hasNextPage ?? false,
				has_previous: rawPageInfo.hasPreviousPage ?? false,
				end_cursor: rawPageInfo.endCursor ?? null,
				start_cursor: rawPageInfo.startCursor ?? null,
			};

			return NextResponse.json({ data, pageInfo });
		} catch (error) {
			console.error("Shopify orders fetch error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch orders from Shopify" },
				{ status: 502 }
			);
		}
	}
);
