// Types for the read-only Shopify Orders module. Rows/details are mapped from
// the Shopify Admin GraphQL API responses into snake_case shapes matching the
// rest of the dashboard.

export interface ShopifyMoney {
	amount: string;
	currency_code: string;
}

export interface ShopifyOrderRow {
	id: string; // gid
	legacy_id: string; // legacyResourceId
	name: string; // "#1001"
	created_at: string;
	financial_status: string | null; // displayFinancialStatus
	fulfillment_status: string | null; // displayFulfillmentStatus
	total: ShopifyMoney;
	customer_name: string | null;
	customer_email: string | null;
	item_count: number;
	admin_url: string;
}

export interface ShopifyOrderLineItem {
	title: string;
	variant_title: string | null;
	sku: string | null;
	quantity: number;
	unit_price: ShopifyMoney | null;
	line_total: ShopifyMoney | null;
	image_url: string | null;
}

export interface ShopifyOrderAddress {
	name: string | null;
	address1: string | null;
	address2: string | null;
	city: string | null;
	province: string | null;
	country: string | null;
	zip: string | null;
	phone: string | null;
}

export interface ShopifyOrderDetail extends ShopifyOrderRow {
	processed_at: string | null;
	cancelled_at: string | null;
	closed_at: string | null;
	note: string | null;
	tags: string[];
	subtotal: ShopifyMoney | null;
	total_shipping: ShopifyMoney | null;
	total_tax: ShopifyMoney | null;
	total_discounts: ShopifyMoney | null;
	customer_phone: string | null;
	shipping_address: ShopifyOrderAddress | null;
	billing_address: ShopifyOrderAddress | null;
	line_items: ShopifyOrderLineItem[];
	tracking: { number: string | null; url: string | null; company: string | null }[];
}

export interface ShopifyOrdersPageInfo {
	has_next: boolean;
	has_previous: boolean;
	end_cursor: string | null;
	start_cursor: string | null;
}
