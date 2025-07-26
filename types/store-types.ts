// Store entity types based on the database schema

export type Currency =
	| "EGP"
	| "USD"
	| "EUR"
	| "GBP"
	| "AED"
	| "SAR"
	| "KWD"
	| "BHD"
	| "OMR"
	| "QAR";
export type RentTerm = "per_day" | "per_week" | "per_month";

export interface Category {
	id: number;
	name: string;
	description?: string;
	created_at: string;
	updated_at: string;
}

export interface Joint {
	id: number;
	name: string;
}

export interface Product {
	id: number;
	name: string;
	description?: string;
	price: number;
	discounted_price?: number;
	currency: Currency;
	stock: number;
	category_id: number;
	is_best_seller: boolean;
	is_featured: boolean;
	is_available: boolean;
	is_for_rent: boolean;
	rent_term?: RentTerm;
	tags: string[];
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProductWithCategory extends Product {
	category: Category;
	product_images?: ProductImage[];
}

export interface ProductImage {
	id: number;
	product_id: number;
	image_url: string;
	is_main: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProductTag {
	id: number;
	product_id: number;
	tag: string;
	created_at: string;
	updated_at: string;
}

export interface ProductJoint {
	product_id: number;
	joint_id: number;
	created_at: string;
	updated_at: string;
}

export interface ProductReview {
	id: number;
	product_id: number;
	patient_id: number;
	rating: number;
	comment?: string;
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

// Extended types for UI components
export interface ProductWithDetails extends Product {
	category: Category;
	product_images: ProductImage[];
	joints: Joint[];
	reviews: ProductReview[];
	average_rating?: number;
	review_count?: number;
}

// Form types for creating/editing
export interface CreateCategoryData {
	name: string;
	description?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
	id: number;
}

export interface CreateJointData {
	name: string;
}

export interface UpdateJointData extends Partial<CreateJointData> {
	id: number;
}

export interface CreateProductData {
	name: string;
	description?: string;
	price: number;
	discounted_price?: number;
	currency: Currency;
	stock: number;
	category_id: number;
	is_best_seller?: boolean;
	is_featured?: boolean;
	is_available?: boolean;
	is_for_rent?: boolean;
	rent_term?: RentTerm;
	tags?: string[];
	joint_ids?: number[];
	images?: { url: string; is_main: boolean }[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
	id: number;
}

export interface CreateProductReviewData {
	product_id: number;
	patient_id: number;
	rating: number;
	comment?: string;
}

export interface BulkCreateReviewsData {
	product_id: number;
	count: number;
	rating: number;
}

// API response types
export interface StoreApiResponse<T> {
	data: T;
	meta?: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface StoreError {
	message: string;
	field?: string;
}
