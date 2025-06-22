import { createClient } from "@/lib/supabase/client";

/**
 * Sets up a listener for session expiration
 * @param onExpire Callback function to execute when session expires
 * @returns Cleanup function
 */
export function setupSessionExpiryHandler(onExpire: () => void) {
	const supabase = createClient();

	// Function to check session status
	const checkSession = async () => {
		const { data, error } = await supabase.auth.getUser();
		if (!data.user || error) {
			onExpire();
		}
	};

	// Set up interval to check session (every minute)
	const intervalId = setInterval(checkSession, 60 * 1000);

	// Return cleanup function
	return () => clearInterval(intervalId);
}
