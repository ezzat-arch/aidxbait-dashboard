// Program subscription types based on database schema

export interface Patient {
	id: number;
	name: string;
	email: string;
	phone?: string;
	created_at: string;
	updated_at: string;
}

export interface Program {
	id: number;
	name: string;
	description?: string;
	price: number;
	currency: string;
	duration_days: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "card" | "instapay" | "cash";

export interface Payment {
	id: number;
	patient_id: number;
	amount: number;
	currency: string;
	payment_method: PaymentMethod;
	status: PaymentStatus;
	transaction_id?: string;
	created_at: string;
	updated_at: string;
}

export interface ProgramSubscription {
	id: number;
	patient_id: number;
	program_id: number;
	payment_id: number;
	is_active: boolean;
	is_cancelled: boolean;
	cancelled_at?: string;
	cancellation_reason?: string;
	start_date: string;
	end_date: string;
	created_at: string;
	updated_at: string;
}

// Extended types for UI components
export interface ProgramSubscriptionWithDetails extends ProgramSubscription {
	patient: Patient;
	program: Program;
	payment: Payment;
}

// Form types for creating/editing
export interface CreateSubscriptionData {
	patient_id: number;
	program_id: number;
	payment_id: number;
	start_date: string;
	end_date: string;
	is_active?: boolean;
}

export interface UpdateSubscriptionData
	extends Partial<CreateSubscriptionData> {
	id: number;
}

export interface CancelSubscriptionData {
	id: number;
	cancellation_reason: string;
}

// API response types
export interface SubscriptionApiResponse<T> {
	data: T;
	meta?: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface SubscriptionError {
	message: string;
	field?: string;
}

// Filter and search types
export interface SubscriptionFilters {
	search?: string;
	status?: "active" | "cancelled" | "all";
	payment_status?: PaymentStatus;
	payment_method?: PaymentMethod;
	date_range?: {
		start: string;
		end: string;
	};
}

// Stats types
export interface SubscriptionStats {
	total_subscriptions: number;
	active_subscriptions: number;
	cancelled_subscriptions: number;
	total_revenue: number;
	revenue_by_method: Record<PaymentMethod, number>;
	revenue_by_status: Record<PaymentStatus, number>;
}
