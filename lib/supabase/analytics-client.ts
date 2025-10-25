import { createClient } from "@supabase/supabase-js";

/**
 * ⚠️ WARNING: This client uses the service role key and bypasses RLS.
 * ONLY use this in Server Components for read-only analytics queries.
 * NEVER expose this to the client side.
 *
 * The analytics page is protected by PermissionGate with ViewAnalytics permission.
 */

let analyticsClient: ReturnType<typeof createClient> | null = null;

function getAnalyticsClient() {
	if (analyticsClient) {
		return analyticsClient;
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			"Missing Supabase environment variables for analytics client"
		);
	}

	analyticsClient = createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return analyticsClient;
}

/**
 * Execute a raw SQL analytics query using Supabase's RPC mechanism.
 * Uses service role to bypass RLS for aggregated analytics.
 *
 * @param sql - The SQL query to execute
 * @returns Array of result rows
 */
export async function executeAnalyticsQuery<T = any>(
	sql: string
): Promise<{ data: T[] | null; error: string | null }> {
	try {
		const client = getAnalyticsClient();

		// Use the rpc method to execute raw SQL
		// Note: This requires a Postgres function named 'execute_analytics_query'
		// For now, we'll return a mock implementation
		// In production, you'd create this function in your database

		// Temporary: Use the database connection directly
		const { data, error } = await client.rpc("execute_analytics_query", {
			query_text: sql,
		});

		if (error) {
			console.error("[Analytics Query Error]", error);
			return { data: null, error: error.message };
		}

		return { data: (data as T[]) || [], error: null };
	} catch (error) {
		console.error("[Analytics Query Failed]", error);
		return {
			data: null,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Get the analytics Supabase client for direct queries.
 * Use this for standard table queries without complex SQL.
 */
export function getAnalyticsSupabase() {
	return getAnalyticsClient();
}
