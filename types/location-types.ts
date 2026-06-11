export interface LocationRow {
	id: number;
	location_name: string;
	latitude: number;
	longitude: number;
	latitude_delta: number;
	longitude_delta: number;
	created_at: string;
	/** How many therapists cover this area (from the list endpoint) */
	therapist_count: number;
	/** Active (non-archived) requests referencing this area */
	request_count: number;
}

export interface LocationFormValues {
	location_name: string;
	latitude: number;
	longitude: number;
	latitude_delta: number;
	longitude_delta: number;
}
