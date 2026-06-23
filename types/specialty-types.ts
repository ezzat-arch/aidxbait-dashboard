export interface SpecialtyRow {
	id: number;
	name: string;
	name_ar: string | null;
	is_active: boolean;
	created_at: string;
	/** How many therapists have this specialty (from the list endpoint) */
	therapist_count: number;
}
