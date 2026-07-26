import { type NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
	PostItemDetail,
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
 * GET /api/protected/blogs/[id]
 *
 * Full post detail: translations (with ordered content blocks) and related
 * Shopify product snapshots.
 */
export const GET = withPermission(
	[Permission.ViewBlogs],
	async (_req: NextRequest, context) => {
		const { id } = await context.params;
		const postId = Number.parseInt(id);
		if (Number.isNaN(postId)) {
			return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
		}

		const { data: post, error } = await supabaseAdmin
			.from("posts")
			.select(
				`
				id, status, featured_image, user_id, published_at, created_at, updated_at,
				post_translations (
					id, language, title, slug, content, excerpt, meta_title, meta_description,
					post_items (id, body, image, video, link, display_order)
				),
				post_shopify_products (
					handle, shopify_product_id, title, image_url, price_amount, currency_code, display_order
				)
			`
			)
			.eq("id", postId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json({ error: "Post not found" }, { status: 404 });
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		const translations = (post.post_translations ?? []).map((t) => ({
			id: t.id,
			language: t.language,
			title: t.title,
			slug: t.slug,
			content: t.content,
			excerpt: t.excerpt,
			meta_title: t.meta_title,
			meta_description: t.meta_description,
			items: ((t.post_items ?? []) as PostItemDetail[]).sort(
				(a, b) => a.display_order - b.display_order
			),
		}));

		const shopifyProducts = (
			(post.post_shopify_products ?? []) as unknown as (ShopifyProductSnapshot & {
				display_order: number;
			})[]
		)
			.sort((a, b) => a.display_order - b.display_order)
			.map((p) => ({
				handle: p.handle,
				shopify_product_id: p.shopify_product_id,
				title: p.title,
				image_url: p.image_url,
				price_amount: p.price_amount,
				currency_code: p.currency_code,
			}));

		return NextResponse.json({
			data: {
				id: post.id,
				status: post.status,
				featured_image: post.featured_image,
				user_id: post.user_id,
				published_at: post.published_at,
				created_at: post.created_at,
				updated_at: post.updated_at,
				translations,
				shopify_products: shopifyProducts,
			},
		});
	}
);

/**
 * PUT /api/protected/blogs/[id]
 *
 * Full update. Translations are synced wholesale against the payload:
 * languages missing from the payload are deleted (their items cascade),
 * present ones are upserted and their items replaced. Related products are
 * replaced wholesale. Non-fatal child errors are collected into `warnings`.
 */
export const PUT = withPermission(
	[Permission.UpdateBlogs],
	async (req: NextRequest, context) => {
		const { id } = await context.params;
		const postId = Number.parseInt(id);
		if (Number.isNaN(postId)) {
			return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
		}

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
			.in("slug", payload.translations.map((t) => t.slug))
			.neq("post_id", postId);
		if (slugCheckError) {
			return NextResponse.json({ error: slugCheckError.message }, { status: 500 });
		}
		if ((slugConflicts ?? []).length > 0) {
			return NextResponse.json(
				{ error: "A post with this slug already exists" },
				{ status: 409 }
			);
		}

		const { data: existingPost, error: existingError } = await supabaseAdmin
			.from("posts")
			.select("id, published_at")
			.eq("id", postId)
			.single();

		if (existingError || !existingPost) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		const updates: Record<string, unknown> = {
			status: payload.status,
			featured_image: payload.featured_image,
			updated_at: new Date().toISOString(),
		};
		// Set published_at the first time the post transitions to published.
		if (payload.status === "published" && !existingPost.published_at) {
			updates.published_at = new Date().toISOString();
		}

		const { data: post, error: postError } = await supabaseAdmin
			.from("posts")
			.update(updates)
			.eq("id", postId)
			.select("id, status, featured_image, user_id, published_at, created_at, updated_at")
			.single();

		if (postError) {
			return NextResponse.json({ error: postError.message }, { status: 500 });
		}

		const warnings: string[] = [];

		// --- Sync translations ---
		const { data: existingTranslations, error: translationsError } =
			await supabaseAdmin
				.from("post_translations")
				.select("id, language")
				.eq("post_id", postId);

		if (translationsError) {
			warnings.push("Failed to load existing translations");
		} else {
			const payloadLanguages = payload.translations.map((t) => t.language);
			const removed = (existingTranslations ?? []).filter(
				(t) => !payloadLanguages.includes(t.language)
			);

			// Delete translations whose language is no longer in the payload
			// (their items cascade).
			if (removed.length > 0) {
				const { error: deleteError } = await supabaseAdmin
					.from("post_translations")
					.delete()
					.in(
						"id",
						removed.map((t) => t.id)
					);
				if (deleteError) {
					console.error("Translation delete error:", deleteError);
					warnings.push("Failed to remove translations no longer present");
				}
			}

			for (const translation of payload.translations) {
				const existing = (existingTranslations ?? []).find(
					(t) => t.language === translation.language
				);

				let translationId: number | null = null;
				if (existing) {
					const { error: updateError } = await supabaseAdmin
						.from("post_translations")
						.update({
							title: translation.title,
							slug: translation.slug,
							content: translation.content,
							excerpt: translation.excerpt,
							meta_title: translation.meta_title,
							meta_description: translation.meta_description,
							updated_at: new Date().toISOString(),
						})
						.eq("id", existing.id);

					if (updateError) {
						if (updateError.code === "23505") {
							return NextResponse.json(
								{ error: "A post with this slug already exists" },
								{ status: 409 }
							);
						}
						console.error("Translation update error:", updateError);
						warnings.push(
							`Failed to update the '${translation.language}' translation`
						);
						continue;
					}
					translationId = existing.id;
				} else {
					const { data: inserted, error: insertError } = await supabaseAdmin
						.from("post_translations")
						.insert([
							{
								post_id: postId,
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

					if (insertError) {
						if (insertError.code === "23505") {
							return NextResponse.json(
								{ error: "A post with this slug already exists" },
								{ status: 409 }
							);
						}
						console.error("Translation insert error:", insertError);
						warnings.push(
							`Failed to add the '${translation.language}' translation`
						);
						continue;
					}
					translationId = inserted.id;
				}

				// Replace this translation's items wholesale.
				const { error: deleteItemsError } = await supabaseAdmin
					.from("post_items")
					.delete()
					.eq("post_translation_id", translationId);

				if (deleteItemsError) {
					console.error("Items delete error:", deleteItemsError);
					warnings.push(
						`Failed to replace content blocks for the '${translation.language}' translation`
					);
					continue;
				}

				if (translation.items.length > 0) {
					const itemInserts = translation.items.map((item, index) => ({
						post_translation_id: translationId,
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
						console.error("Items insert error:", itemsError);
						warnings.push(
							`Failed to save content blocks for the '${translation.language}' translation`
						);
					}
				}
			}
		}

		// --- Replace related Shopify products wholesale ---
		const { error: deleteProductsError } = await supabaseAdmin
			.from("post_shopify_products")
			.delete()
			.eq("post_id", postId);

		if (deleteProductsError) {
			console.error("Post shopify products delete error:", deleteProductsError);
			warnings.push("Failed to replace related products");
		} else if (payload.shopify_products.length > 0) {
			const productInserts = payload.shopify_products.map((product, index) => ({
				post_id: postId,
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
				console.error("Post shopify products insert error:", productsError);
				warnings.push("Failed to save related products");
			}
		}

		return NextResponse.json({
			data: post,
			message: "Post updated successfully",
			...(warnings.length > 0 && { warnings }),
		});
	}
);

/**
 * DELETE /api/protected/blogs/[id]
 *
 * Hard delete. Translations, content blocks and related-product links are
 * removed by FK cascade.
 */
export const DELETE = withPermission(
	[Permission.DeleteBlogs],
	async (_req: NextRequest, context) => {
		const { id } = await context.params;
		const postId = Number.parseInt(id);
		if (Number.isNaN(postId)) {
			return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
		}

		const { error } = await supabaseAdmin
			.from("posts")
			.delete()
			.eq("id", postId);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	}
);
