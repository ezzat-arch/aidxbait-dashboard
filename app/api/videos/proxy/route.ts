import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/videos/proxy
 *
 * Proxies video segment requests to CloudFront to bypass CORS restrictions.
 * This endpoint fetches the requested content from CloudFront and returns it
 * with proper CORS headers, allowing the browser to play encrypted HLS content.
 *
 * Query params:
 *   - url: The CloudFront URL to fetch (URL-encoded)
 *   - token: JWT access token for authentication
 *
 * Response:
 *   - 200: The proxied content with appropriate headers
 *   - 400: Missing required parameters
 *   - 401: Invalid or missing token
 *   - 502: Failed to fetch from CloudFront
 */
export async function GET(request: NextRequest) {
	try {
		// ------------------------------------------------------------------------
		// 1. Extract parameters from query string
		// ------------------------------------------------------------------------
		const { searchParams } = new URL(request.url);
		const url = searchParams.get("url");
		const token = searchParams.get("token");

		if (!url) {
			return NextResponse.json(
				{ error: "URL parameter is required" },
				{ status: 400 }
			);
		}

		if (!token) {
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
			return NextResponse.json(
				{ error: "Invalid or expired token" },
				{ status: 401 }
			);
		}

		// ------------------------------------------------------------------------
		// 3. Validate URL is from allowed domain (CloudFront)
		// ------------------------------------------------------------------------
		const decodedUrl = decodeURIComponent(url);
		const allowedDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

		if (allowedDomain && !decodedUrl.startsWith(allowedDomain)) {
			return NextResponse.json(
				{ error: "URL not from allowed domain" },
				{ status: 403 }
			);
		}

		// ------------------------------------------------------------------------
		// 4. Fetch content from CloudFront
		// ------------------------------------------------------------------------
		const response = await fetch(decodedUrl, {
			method: "GET",
			headers: {
				// Forward range requests if present
				...(request.headers.has("range")
					? { Range: request.headers.get("range")! }
					: {}),
			},
		});

		if (!response.ok) {
			console.error(
				"[proxy] Failed to fetch from CloudFront:",
				response.status,
				decodedUrl
			);
			return NextResponse.json(
				{ error: "Failed to fetch content" },
				{ status: 502 }
			);
		}

		// ------------------------------------------------------------------------
		// 5. Determine content type based on URL extension
		// ------------------------------------------------------------------------
		let contentType = response.headers.get("content-type") || "application/octet-stream";

		// Ensure correct MIME type for HLS segments
		if (decodedUrl.endsWith(".ts")) {
			contentType = "video/mp2t";
		} else if (decodedUrl.endsWith(".m3u8")) {
			contentType = "application/vnd.apple.mpegurl";
		}

		// ------------------------------------------------------------------------
		// 6. Return proxied content with CORS headers
		// ------------------------------------------------------------------------
		const body = await response.arrayBuffer();

		return new Response(body, {
			status: response.status,
			headers: {
				"Content-Type": contentType,
				"Content-Length": body.byteLength.toString(),
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Range, Content-Type",
				"Cache-Control": "private, max-age=300",
				// Forward range response headers if present
				...(response.headers.has("content-range")
					? { "Content-Range": response.headers.get("content-range")! }
					: {}),
				...(response.headers.has("accept-ranges")
					? { "Accept-Ranges": response.headers.get("accept-ranges")! }
					: {}),
			},
		});
	} catch (error) {
		console.error("[proxy] Unexpected error:", error);
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
			"Access-Control-Allow-Headers": "Range, Content-Type, Authorization",
			"Access-Control-Max-Age": "86400",
		},
	});
}

