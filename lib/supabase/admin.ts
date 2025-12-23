import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 *
 * Uses the service role key for privileged database operations.
 * This client bypasses Row Level Security (RLS) policies.
 *
 * SECURITY: Never expose this client or service role key to client-side code.
 */
export const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}
);

