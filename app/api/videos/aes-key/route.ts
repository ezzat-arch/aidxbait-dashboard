import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/videos/aes-key
 *
 * Returns the AES-128 decryption key for HLS video playback.
 * The key is returned as raw binary (16 bytes) as required by HLS players.
 *
 * Query params:
 *   - token: JWT access token for authentication
 *
 * Response:
 *   - 200: Raw binary AES key (16 bytes)
 *   - 401: Invalid or missing token
 *   - 500: Server error
 */
export async function GET(request: NextRequest) {
	try {
		// ------------------------------------------------------------------------
		// 1. Extract token from query params
		// ------------------------------------------------------------------------
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (!token) {
			console.error("[aes-key] Missing token parameter");
			return NextResponse.json(
				{ error: "Token is required" },
				{ status: 401 }
			);
		}

		// ------------------------------------------------------------------------
		// 2. Validate token with Supabase
		// ------------------------------------------------------------------------
		const {
			data: { user },
			error: authError,
		} = await supabaseAdmin.auth.getUser(token);

		if (authError || !user) {
			console.error("[aes-key] Invalid token:", authError?.message);
			return NextResponse.json(
				{ error: "Invalid or expired token" },
				{ status: 401 }
			);
		}

		// ------------------------------------------------------------------------
		// 3. Fetch AES key from constants table
		// ------------------------------------------------------------------------
		const { data: keyData, error: dbError } = await supabaseAdmin
			.from("constants")
			.select("constant_value")
			.eq("constant_key", "aes-key")
			.single();

		if (dbError || !keyData) {
			console.error("[aes-key] Failed to fetch AES key:", dbError?.message);
			return NextResponse.json(
				{ error: "Failed to retrieve encryption key" },
				{ status: 500 }
			);
		}

		const hexKey = keyData.constant_value;

		// Validate hex key format (should be 32 hex chars = 16 bytes)
		if (!hexKey || hexKey.length !== 32 || !/^[0-9a-fA-F]+$/.test(hexKey)) {
			console.error("[aes-key] Invalid key format in database:", {
				keyLength: hexKey?.length,
				isHex: /^[0-9a-fA-F]+$/.test(hexKey || ""),
			});
			return NextResponse.json(
				{ error: "Invalid encryption key format" },
				{ status: 500 }
			);
		}

		// ------------------------------------------------------------------------
		// 4. Convert hex string to binary buffer
		// ------------------------------------------------------------------------
		const binaryKey = Buffer.from(hexKey, "hex");

		// ------------------------------------------------------------------------
		// 5. Return raw binary key with CORS headers
		// ------------------------------------------------------------------------
		return new Response(binaryKey, {
			status: 200,
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Length": binaryKey.length.toString(),
				// Prevent caching of the key for security
				"Cache-Control": "no-store, no-cache, must-revalidate",
				// CORS headers for cross-origin requests
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Authorization, Content-Type",
			},
		});
	} catch (error) {
		console.error("[aes-key] Unexpected error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Authorization, Content-Type",
			"Access-Control-Max-Age": "86400",
		},
	});
}

