import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

// Mirrors the website's Storefront API usage (lib/shopify) — the dashboard is
// English-only, so no `@inContext(language:)` is needed here.
const SEARCH_PRODUCTS_QUERY = `
	query searchProducts($query: String!) {
		products(first: 20, query: $query) {
			edges {
				node {
					id
					title
					handle
					availableForSale
					images(first: 1) {
						edges {
							node {
								url
							}
						}
					}
					priceRange {
						minVariantPrice {
							amount
							currencyCode
						}
					}
				}
			}
		}
	}
`;

type ShopifyProductNode = {
	id: string;
	title: string;
	handle: string;
	availableForSale: boolean;
	images?: { edges?: { node?: { url?: string } }[] };
	priceRange?: { minVariantPrice?: { amount?: string; currencyCode?: string } };
};

/**
 * GET /api/protected/blogs/shopify-products?search=
 *
 * Search Shopify Storefront products for the blog "related products" picker.
 * An empty search lists the first 20 products. Returns display snapshots
 * (handle + title/image/price) the dashboard stores alongside the post.
 */
export const GET = withPermission(
	[Permission.CreateBlogs, Permission.UpdateBlogs],
	async (req: NextRequest) => {
		const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
		const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
		if (!domain || !token) {
			return NextResponse.json(
				{
					error:
						"Shopify is not configured (set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN)",
				},
				{ status: 500 }
			);
		}

		const { searchParams } = new URL(req.url);
		const search = searchParams.get("search")?.trim() || "";

		try {
			const result = await fetch(`https://${domain}/api/2024-04/graphql.json`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Shopify-Storefront-Access-Token": token,
				},
				body: JSON.stringify({
					query: SEARCH_PRODUCTS_QUERY,
					variables: { query: search ? `title:*${search}*` : "" },
				}),
				cache: "no-store",
			});

			const body = await result.json();

			if (!result.ok || body.errors?.length) {
				console.error(
					"Shopify products fetch error:",
					body.errors ?? `HTTP ${result.status}`
				);
				return NextResponse.json(
					{ error: "Failed to fetch products from Shopify" },
					{ status: 502 }
				);
			}

			const edges = (body.data?.products?.edges ?? []) as {
				node: ShopifyProductNode;
			}[];
			const data = edges.map(({ node }) => ({
				id: node.id,
				handle: node.handle,
				title: node.title,
				image_url: node.images?.edges?.[0]?.node?.url ?? null,
				price_amount: node.priceRange?.minVariantPrice?.amount ?? null,
				currency_code: node.priceRange?.minVariantPrice?.currencyCode ?? null,
				available_for_sale: node.availableForSale,
			}));

			return NextResponse.json({ data });
		} catch (error) {
			console.error("Shopify products fetch error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch products from Shopify" },
				{ status: 502 }
			);
		}
	}
);
