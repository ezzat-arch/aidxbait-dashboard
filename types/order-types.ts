// Order-related enums matching database types
export enum OrderType {
	Purchase = "purchase",
	Rental = "rental",
}

export enum PaymentMethod {
	CashOnDelivery = "cash_on_delivery",
	Online = "online",
}

export enum PaymentStatus {
	Pending = "pending",
	Completed = "completed",
	Failed = "failed",
	Refunded = "refunded",
}

export enum OrderStatus {
	Pending = "pending",
	Confirmed = "confirmed",
	Shipped = "shipped",
	Delivered = "delivered",
	Cancelled = "cancelled",
}

// Base order interface matching database schema
export interface Order {
	id: number;
	order_type: OrderType;
	patient_id: number;
	shipping_address_id: number | null;
	billing_address_id: number | null;
	order_date: string;
	subtotal_amount: number;
	tax_amount: number;
	discount_amount: number;
	shipping_amount: number;
	total_amount: number;
	payment_method: PaymentMethod;
	payment_status: PaymentStatus;
	order_status: OrderStatus;
	paymob_order_id: string | null;
	paymob_transaction_id: string | null;
	paymob_payment_key: string | null;
	cancellation_reason: string | null;
	cancellation_date: string | null;
	cancelled_by: number | null;
	delivery_date: string | null;
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

// Order item interface
export interface OrderItem {
	id: number;
	order_id: number;
	product_id: number;
	quantity: number;
	price_at_purchase: number;
	rental_start_date: string | null;
	rental_end_date: string | null;
	created_at: string;
	updated_at: string;
}

// Patient address interface
export interface PatientAddress {
	id: number;
	patient_id: number;
	address_type: string;
	street_address: string;
	city: string;
	state: string | null;
	postal_code: string | null;
	country: string;
	is_default: boolean;
	created_at: string;
	updated_at: string;
}

// Patient info for order display
export interface PatientInfo {
	id: number;
	user_id: number;
	first_name: string | null;
	last_name: string | null;
	phone_number: string;
	email: string | null;
	image_url: string | null;
}

// Order item with product details
export interface OrderItemWithProduct extends OrderItem {
	product: {
		id: number;
		name: string;
		image_url: string | null;
	};
}

// Order with full details for display
export interface OrderWithDetails extends Order {
	patient: PatientInfo;
	shipping_address: PatientAddress | null;
	billing_address: PatientAddress | null;
	order_items: OrderItemWithProduct[];
	items_count: number;
	cancelled_by_user?: {
		first_name: string | null;
		last_name: string | null;
	} | null;
}

// Filter options for orders
export interface OrderFilters {
	search: string;
	order_status: OrderStatus[];
	payment_status: PaymentStatus[];
	payment_method: PaymentMethod[];
	order_type: OrderType[];
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

// Helper type for status updates
export interface OrderStatusUpdate {
	order_status: OrderStatus;
}

// Helper type for order cancellation
export interface OrderCancellation {
	cancellation_reason: string;
}
