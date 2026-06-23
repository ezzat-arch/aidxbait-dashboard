export type TherapistAccountStatus =
	| "pending_documents"
	| "pending_review"
	| "approved"
	| "rejected"
	| "suspended";

export interface TherapistRow {
	id: number;
	account_status: TherapistAccountStatus;
	specialty: string | null;
	bio: string | null;
	gender: string | null;
	experience_years: number | null;
	rejection_reason: string | null;
	is_available: boolean;
	created_at: string;
	user_id: number | null;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	phone_number: string | null;
	image_url: string | null;
	document_count: number;
	areas: string[];
}

export interface TherapistDocument {
	id: number;
	document_type: string;
	file_url: string;
	file_name: string;
	mime_type: string | null;
	size_kb: number | null;
	status: string;
	review_notes: string | null;
	created_at: string;
	signed_url: string | null;
}

export interface TherapistReview {
	id: number;
	rating: number;
	comment: string | null;
	created_at: string;
}

export interface TherapistDetail {
	id: number;
	account_status: TherapistAccountStatus;
	specialty: string | null;
	bio: string | null;
	gender: string | null;
	experience_years: number | null;
	rejection_reason: string | null;
	is_available: boolean;
	created_at: string;
	updated_at: string;
	rating_avg: number;
	rating_count: number;
	reviews: TherapistReview[];
	users: {
		id: number;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		phone_number: string | null;
		image_url: string | null;
	} | null;
	areas: { id: number; location_name: string }[];
	documents: TherapistDocument[];
}

export const STATUS_LABELS: Record<TherapistAccountStatus, string> = {
	pending_documents: "Pending documents",
	pending_review: "Pending review",
	approved: "Approved",
	rejected: "Rejected",
	suspended: "Suspended",
};

export const STATUS_BADGE_CLASS: Record<TherapistAccountStatus, string> = {
	pending_documents: "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30",
	pending_review: "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30",
	approved: "bg-green-500/20 text-green-600 hover:bg-green-500/30",
	rejected: "bg-red-500/20 text-red-600 hover:bg-red-500/30",
	suspended: "bg-zinc-500/20 text-zinc-500 hover:bg-zinc-500/30",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	national_id: "National ID",
	practice_license: "Practice license",
	degree_certificate: "Degree certificate",
	syndicate_card: "Syndicate card",
	cv: "CV",
	other: "Other",
};
