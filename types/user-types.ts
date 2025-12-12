export type UserType =
	| "patient"
	| "therapist"
	| "consultant"
	| "admin"
	| "superuser";

export type GenderType = "Male" | "Female" | "Unknown";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";
export type SupportedLanguage = "Arabic" | "English";
export type PatientAccountStatus = "Active" | "Deleted" | "Deceased";
export type ConsultantSpecialization = "orthopedic" | "nutrition" | "psychology";

export interface UserData {
	id: number;
	phone_number: string;
	email: string | null;
	supabase_id: string;
	first_name: string | null;
	last_name: string | null;
	user_type: UserType;
	image_url: string | null;
	is_website_user?: boolean;
	created_at: string;
	updated_at: string;
	admin_id?: number | null;
	superuser_id?: number | null;
}

export interface AdminData {
	id: number;
	user_id: number;
	created_at: string;
	updated_at: string;
}

export interface SuperuserData {
	id: number;
	user_id: number;
	created_at: string;
	updated_at: string;
}

export interface PatientData {
	id: number;
	user_id: number;
	date_of_birth: string;
	gender: GenderType;
	national_id: string | null;
	blood_type: BloodType;
	marital_status: MaritalStatus;
	preferred_language: SupportedLanguage;
	has_insurance: boolean;
	insurance_provider: string | null;
	insurance_number: string | null;
	notes: string | null;
	status: PatientAccountStatus;
	created_at: string;
	updated_at: string;
}

export interface PatientAddressData {
	id: number;
	patient_id: number;
	address_type: "House" | "Apartment";
	address_label: string;
	google_map_url: string | null;
	latitude: number | null;
	longitude: number | null;
	governorate: string;
	city: string;
	street: string;
	building_name: string | null;
	floor: string | null;
	apartment: string | null;
	additional_directions: string | null;
	phone: string | null;
	is_primary: boolean;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface TherapistData {
	id: number;
	user_id: number;
	created_at: string;
	updated_at: string;
}

export interface ConsultantData {
	id: number;
	user_id: number;
	bio: string;
	specialization: ConsultantSpecialization;
	experience_years: number;
	credentials: string | null;
	certifications: string | null;
	languages_spoken: string[];
	is_available: boolean;
	availability: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

// Extended type for user details view with role-specific data
export interface UserDetails extends UserData {
	patient?: PatientData | null;
	therapist?: TherapistData | null;
	consultant?: ConsultantData | null;
	admin?: AdminData | null;
	superuser?: SuperuserData | null;
	patient_addresses?: PatientAddressData[] | null;
}
