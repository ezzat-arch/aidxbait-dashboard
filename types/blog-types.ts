export type PostStatus = "draft" | "published" | "archived";

export type PostLanguage = "en" | "ar";

/** Row shape returned by GET /api/protected/blogs (list endpoint) */
export interface PostListRow {
	id: number;
	status: PostStatus;
	featured_image: string | null;
	published_at: string | null;
	created_at: string;
	updated_at: string;
	author_name: string | null;
	title_en: string | null;
	title_ar: string | null;
	slug_en: string | null;
	product_count: number;
}

/** Content block under a translation, ordered by display_order */
export interface PostItemDetail {
	id: number;
	body: string;
	image: string | null;
	video: string | null;
	link: string | null;
	display_order: number;
}

export interface PostTranslationDetail {
	id: number;
	language: PostLanguage;
	title: string;
	slug: string;
	content: string;
	excerpt: string | null;
	meta_title: string | null;
	meta_description: string | null;
	items: PostItemDetail[];
}

/**
 * Shopify product option returned by GET /api/protected/blogs/shopify-products
 * (also the shape held by the blog-form related-products picker).
 */
export interface ShopifyProductOption {
	/** Shopify gid, e.g. "gid://shopify/Product/123" */
	id: string | null;
	handle: string;
	title: string;
	image_url: string | null;
	price_amount: string | null;
	currency_code: string | null;
	available_for_sale?: boolean;
}

/**
 * Related-product display snapshot sent in POST/PUT payloads and returned by
 * GET /api/protected/blogs/[id] (display_order = array index server-side).
 */
export interface ShopifyProductSnapshot {
	handle: string;
	shopify_product_id: string | null;
	title: string;
	image_url: string | null;
	price_amount: string | null;
	currency_code: string | null;
}

/** Full detail returned by GET /api/protected/blogs/[id] */
export interface PostDetail {
	id: number;
	status: PostStatus;
	featured_image: string | null;
	user_id: number;
	published_at: string | null;
	created_at: string;
	updated_at: string;
	translations: PostTranslationDetail[];
	shopify_products: ShopifyProductSnapshot[];
}

/** Item entry sent to POST/PUT (display_order = array index server-side) */
export interface PostItemPayload {
	body: string;
	image: string | null;
	video: string | null;
	link: string | null;
}

export interface PostTranslationPayload {
	language: PostLanguage;
	title: string;
	slug: string;
	content: string;
	excerpt: string | null;
	meta_title: string | null;
	meta_description: string | null;
	items: PostItemPayload[];
}

/** Shared payload accepted by POST /api/protected/blogs and PUT /api/protected/blogs/[id] */
export interface PostPayload {
	status: PostStatus;
	featured_image: string | null;
	shopify_products: ShopifyProductSnapshot[];
	/** 1..2 entries; "en" is required, "ar" is optional */
	translations: PostTranslationPayload[];
}
