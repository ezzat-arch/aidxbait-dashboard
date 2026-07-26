import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
	PostPayload,
	PostStatus,
	PostTranslationPayload,
	ShopifyProductSnapshot,
} from "@/types/blog-types";

const POST_STATUSES: PostStatus[] = ["draft", "published", "archived"];

/**
 * Manually validate the shared POST/PUT payload (no zod in API routes).
 * Returns a normalized payload or an error string.
 */
function validatePostPayload(
	body: Record<string, unknown>
): { ok: true; payload: PostPayload } | { ok: false; error: string } {
	const status = String(body.status ?? "");
	if (!POST_STATUSES.includes(status as PostStatus)) {
		return { ok: false, error: "status must be one of: draft, published, archived" };
	}

	const featuredImage = body.featured_image
		? String(body.featured_image).trim()
		: null;

	if (
		body.shopify_products !== undefined &&
		!Array.isArray(body.shopify_products)
	) {
		return { ok: false, error: "shopify_products must be an array" };
	}
	const shopifyProducts: ShopifyProductSnapshot[] = [];
	for (const raw of (body.shopify_products as Record<string, unknown>[]) ?? []) {
		const handle = String(raw?.handle ?? "").trim();
		const title = String(raw?.title ?? "").trim();
		if (!handle) {
			return { ok: false, error: "Every related product needs a handle" };
		}
		if (!title) {
			return { ok: false, error: "Every related product needs a title" };
		}
		shopifyProducts.push({
			handle,
			shopify_product_id: raw.shopify_product_id
				? String(raw.shopify_product_id).trim()
				: null,
			title,
			image_url: raw.image_url ? String(raw.image_url).trim() : null,
			price_amount: raw.price_amount ? String(raw.price_amount).trim() : null,
			currency_code: raw.currency_code
				? String(raw.currency_code).trim()
				: null,
		});
	}

	if (!Array.isArray(body.translations) || body.translations.length === 0) {
		return { ok: false, error: "translations must be a non-empty array" };
	}

	const translations: PostTranslationPayload[] = [];
	const seenLanguages = new Set<string>();
	const seenSlugs = new Set<string>();
	for (const raw of body.translations as Record<string, unknown>[]) {
		const language = String(raw?.language ?? "");
		if (language !== "en" && language !== "ar") {
			return { ok: false, error: "translation language must be 'en' or 'ar'" };
		}
		if (seenLanguages.has(language)) {
			return { ok: false, error: `Duplicate translation for language '${language}'` };
		}
		seenLanguages.add(language);

		const title = String(raw.title ?? "").trim();
		const slug = String(raw.slug ?? "").trim().toLowerCase();
		if (seenSlugs.has(slug)) {
			return { ok: false, error: "Each translation needs a distinct slug" };
		}
		seenSlugs.add(slug);
		const content = String(raw.content ?? "").trim();
		if (!title) {
			return { ok: false, error: `title is required for the '${language}' translation` };
		}
		if (!slug) {
			return { ok: false, error: `slug is required for the '${language}' translation` };
		}
		if (!content) {
			return { ok: false, error: `content is required for the '${language}' translation` };
		}

		if (raw.items !== undefined && !Array.isArray(raw.items)) {
			return { ok: false, error: "translation items must be an array" };
		}
		const items = [];
		for (const item of (raw.items as Record<string, unknown>[]) ?? []) {
			const itemBody = String(item?.body ?? "").trim();
			if (!itemBody) {
				return {
					ok: false,
					error: `Every content block needs a body ('${language}' translation)`,
				};
			}
			items.push({
				body: itemBody,
				image: item.image ? String(item.image).trim() : null,
				video: item.video ? String(item.video).trim() : null,
				link: item.link ? String(item.link).trim() : null,
			});
		}

		translations.push({
			language,
			title,
			slug,
			content,
			excerpt: raw.excerpt ? String(raw.excerpt).trim() : null,
			meta_title: raw.meta_title ? String(raw.meta_title).trim() : null,
			meta_description: raw.meta_description
				? String(raw.meta_description).trim()
				: null,
			items,
		});
	}

	if (!seenLanguages.has("en")) {
		return { ok: false, error: "An English translation is required" };
	}

	return {
		ok: true,
		payload: {
			status: status as PostStatus,
			featured_image: featuredImage,
			shopify_products: shopifyProducts,
			translations,
		},
	};
}

/**
 * GET /api/protected/blogs
 *
 * List posts with search + status filter + pagination.
 * Query params: page, limit, search, status
 */
export const GET = withPermission(
	[Permission.ViewBlogs],
	async (req: NextRequest) => {
		const { searchParams } = new URL(req.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search")?.trim() || "";
		const status = searchParams.get("status")?.trim() || "";

		const from = (page - 1) * limit;
		const to = from + limit - 1;

		let query = supabaseAdmin
			.from("posts")
			.select(
				"id, status, featured_image, published_at, created_at, updated_at, users (first_name, last_name)",
				{ count: "exact" }
			)
			.order("created_at", { ascending: false });

		if (status && POST_STATUSES.includes(status as PostStatus)) {
			query = query.eq("status", status);
		}

		if (search) {
			// Search titles in post_translations first, then filter posts by id
			// (avoids embedded-table .or() pitfalls).
			const { data: matches, error: searchError } = await supabaseAdmin
				.from("post_translations")
				.select("post_id")
				.ilike("title", `%${search}%`);

			if (searchError) {
				return NextResponse.json(
					{ error: searchError.message },
					{ status: 500 }
				);
			}

			const postIds = [...new Set((matches ?? []).map((m) => m.post_id))];
			if (postIds.length === 0) {
				return NextResponse.json({
					data: [],
					meta: { total: 0, page, limit, totalPages: 0 },
				});
			}
			query = query.in("id", postIds);
		}

		const { data, error, count } = await query.range(from, to);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Titles/slugs + related-product counts for the posts on this page
		const ids = (data ?? []).map((p) => p.id);
		const titlesByPost: Record<
			number,
			{ title_en: string | null; title_ar: string | null; slug_en: string | null }
		> = {};
		const productCounts: Record<number, number> = {};
		if (ids.length > 0) {
			const [{ data: translations }, { data: postProducts }] =
				await Promise.all([
					supabaseAdmin
						.from("post_translations")
						.select("post_id, language, title, slug")
						.in("post_id", ids),
					supabaseAdmin
						.from("post_shopify_products")
						.select("post_id")
						.in("post_id", ids),
				]);

			for (const t of translations ?? []) {
				const entry = (titlesByPost[t.post_id] = titlesByPost[t.post_id] || {
					title_en: null,
					title_ar: null,
					slug_en: null,
				});
				if (t.language === "en") {
					entry.title_en = t.title;
					entry.slug_en = t.slug;
				} else if (t.language === "ar") {
					entry.title_ar = t.title;
				}
			}
			for (const pp of postProducts ?? []) {
				productCounts[pp.post_id] = (productCounts[pp.post_id] || 0) + 1;
			}
		}

		const rows = (data ?? []).map((p) => {
			const author = p.users as unknown as
				| { first_name: string | null; last_name: string | null }
				| null;
			const authorName = [author?.first_name, author?.last_name]
				.filter(Boolean)
				.join(" ")
				.trim();
			return {
				id: p.id,
				status: p.status,
				featured_image: p.featured_image,
				published_at: p.published_at,
				created_at: p.created_at,
				updated_at: p.updated_at,
				author_name: authorName || null,
				title_en: titlesByPost[p.id]?.title_en ?? null,
				title_ar: titlesByPost[p.id]?.title_ar ?? null,
				slug_en: titlesByPost[p.id]?.slug_en ?? null,
				product_count: productCounts[p.id] || 0,
			};
		});

		return NextResponse.json({
			data: rows,
			meta: {
				total: count || 0,
				page,
				limit,
				totalPages: count ? Math.ceil(count / limit) : 0,
			},
		});
	}
);

/**
 * POST /api/protected/blogs
 *
 * Create a post with its translations, content blocks and related Shopify
 * products (display snapshots).
 * Body: { status, featured_image?, shopify_products?, translations: [...] }
 */
export const POST = withPermission(
	[Permission.CreateBlogs],
	async (req: NextRequest, context, user) => {
		const body = await req.json().catch(() => ({}));
		const validated = validatePostPayload(body);
		if (!validated.ok) {
			return NextResponse.json({ error: validated.error }, { status: 400 });
		}
		const payload = validated.payload;

		// Reject slug conflicts up front - nothing has been written yet.
		const { data: slugConflicts, error: slugCheckError } = await supabaseAdmin
			.from("post_translations")
			.select("id")
			.in("slug", payload.translations.map((t) => t.slug));
		if (slugCheckError) {
			return NextResponse.json({ error: slugCheckError.message }, { status: 500 });
		}
		if ((slugConflicts ?? []).length > 0) {
			return NextResponse.json(
				{ error: "A post with this slug already exists" },
				{ status: 409 }
			);
		}

		const { data: post, error: postError } = await supabaseAdmin
			.from("posts")
			.insert([
				{
					status: payload.status,
					featured_image: payload.featured_image,
					user_id: Number.parseInt(user.id),
					published_at:
						payload.status === "published" ? new Date().toISOString() : null,
				},
			])
			.select("id")
			.single();

		if (postError) {
			return NextResponse.json({ error: postError.message }, { status: 500 });
		}

		// Attempt to remove the post again if a child insert fails (FKs cascade).
		const cleanup = async () => {
			await supabaseAdmin.from("posts").delete().eq("id", post.id);
		};

		for (const translation of payload.translations) {
			const { data: inserted, error: translationError } = await supabaseAdmin
				.from("post_translations")
				.insert([
					{
						post_id: post.id,
						language: translation.language,
						title: translation.title,
						slug: translation.slug,
						content: translation.content,
						excerpt: translation.excerpt,
						meta_title: translation.meta_title,
						meta_description: translation.meta_description,
					},
				])
				.select("id")
				.single();

			if (translationError) {
				await cleanup();
				if (translationError.code === "23505") {
					return NextResponse.json(
						{ error: "A post with this slug already exists" },
						{ status: 409 }
					);
				}
				return NextResponse.json(
					{ error: translationError.message },
					{ status: 500 }
				);
			}

			if (translation.items.length > 0) {
				const itemInserts = translation.items.map((item, index) => ({
					post_translation_id: inserted.id,
					body: item.body,
					image: item.image,
					video: item.video,
					link: item.link,
					display_order: index,
				}));

				const { error: itemsError } = await supabaseAdmin
					.from("post_items")
					.insert(itemInserts);

				if (itemsError) {
					await cleanup();
					return NextResponse.json(
						{ error: itemsError.message },
						{ status: 500 }
					);
				}
			}
		}

		if (payload.shopify_products.length > 0) {
			const productInserts = payload.shopify_products.map((product, index) => ({
				post_id: post.id,
				handle: product.handle,
				shopify_product_id: product.shopify_product_id,
				title: product.title,
				image_url: product.image_url,
				price_amount: product.price_amount,
				currency_code: product.currency_code,
				display_order: index,
			}));

			const { error: productsError } = await supabaseAdmin
				.from("post_shopify_products")
				.insert(productInserts);

			if (productsError) {
				await cleanup();
				return NextResponse.json(
					{ error: productsError.message },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json(
			{ data: { id: post.id }, message: "Post created successfully" },
			{ status: 201 }
		);
	}
);
