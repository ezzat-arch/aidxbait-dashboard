export interface UserData {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	lastActive: string;
}

export interface AdminData {
	id: string;
	supabase_id: string;
	email: string;
	created_at: string;
}
