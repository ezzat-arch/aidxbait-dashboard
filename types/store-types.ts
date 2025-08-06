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

// Product joint names - separate from program joint names
export interface ProductJointName {
	id: number;
	name: string;
	name_ar: string;
}

export interface Product {
	id: number;
	name: string;
	name_ar: string;
	description?: string;
	description_ar?: string;
	price: number;
	discounted_price?: number;
	currency: Currency;
	stock: number;
	is_best_seller: boolean;
	is_featured: boolean;
	is_available: boolean;
	is_oos: boolean;
	is_for_rent: boolean;
	rent_term?: RentTerm;
	tags: string[];
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProductWithJoints extends Product {
	product_images?: ProductImage[];
	joints?: ProductJointName[];
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
	product_images: ProductImage[];
	joints: ProductJointName[];
	reviews: ProductReview[];
	average_rating?: number;
	review_count?: number;
}

// Form types for creating/editing
export interface CreateProductJointNameData {
	name: string;
	name_ar: string;
}

export interface UpdateProductJointNameData
	extends Partial<CreateProductJointNameData> {
	id: number;
}

export interface CreateProductData {
	name: string;
	name_ar: string;
	description?: string;
	description_ar?: string;
	price: number;
	discounted_price?: number;
	currency: Currency;
	stock: number;
	is_best_seller?: boolean;
	is_featured?: boolean;
	is_available?: boolean;
	is_oos?: boolean;
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

// Upload-related types
export interface UploadProgress {
	current: number;
	total: number;
	currentFileName: string;
}

export interface UploadError {
	fileName: string;
	error: string;
}

export interface UploadResult {
	filename: string;
	url: string;
	size: number;
	type: string;
}

// Component prop types
export interface ProductFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	title: string;
	description: string;
	product?: ProductWithDetails;
}

export interface ProductFormDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	title: string;
	description: string;
	product?: ProductWithJoints;
}

export interface JointFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: { name: string; name_ar: string }) => Promise<void>;
	title: string;
	description: string;
	defaultValues?: {
		name: string;
		name_ar: string;
	};
}

export interface DeleteConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
	title: string;
	description: string;
}

export interface BulkReviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	products: ProductWithJoints[];
}
