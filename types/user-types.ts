export type UserType =
        | "patient"
        | "therapist"
        | "consultant"
        | "admin"
        | "superuser";

export interface UserData {
        id: number;
        phone_number: string;
        email: string | null;
        supabase_id: string;
        first_name: string | null;
        last_name: string | null;
        user_type: UserType;
        image_url: string | null;
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
