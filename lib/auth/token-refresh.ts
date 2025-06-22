import { createClient } from "@/lib/supabase/client";

// Time before token expiry to trigger refresh (5 minutes)
const REFRESH_THRESHOLD = 5 * 60 * 1000;

/**
 * Sets up automatic token refresh for Supabase authentication
 * This should be called once when the application initializes
 */
export function setupTokenRefresh() {
	const supabase = createClient();

	// Function to check and refresh token if needed
	const checkAndRefreshToken = async () => {
		try {
			// For token refresh, we actually do need the session to get expiry info
			// but we'll validate the user first
			const { data: userData, error: userError } =
				await supabase.auth.getUser();
			if (!userData.user || userError) return;

			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session) return;

			// Calculate time until expiry
			const expiresAt = new Date(session.expires_at || "").getTime();
			const now = Date.now();
			const timeUntilExpiry = expiresAt - now;

			// If token is close to expiry, refresh it
			if (timeUntilExpiry < REFRESH_THRESHOLD) {
				await supabase.auth.refreshSession();
				console.log("Auth token refreshed");
			}
		} catch (error) {
			console.error("Error refreshing token:", error);
		}
	};

	// Check token on initialization
	checkAndRefreshToken();

	// Set up interval to check token (every minute)
	const intervalId = setInterval(checkAndRefreshToken, 60 * 1000);

	// Return cleanup function
	return () => clearInterval(intervalId);
}
