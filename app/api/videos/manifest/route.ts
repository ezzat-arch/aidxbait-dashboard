import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/videos/manifest
 *
 * Rewrites HLS manifest files to include authentication tokens for secure video playback.
 * This endpoint:
 * 1. Validates the user's JWT token
 * 2. Fetches the original manifest from CloudFront
 * 3. Rewrites all URLs in the manifest to include the auth token
 * 4. Returns the rewritten manifest content
 *
 * Body: { videoUrl: string }
 * Headers: Authorization: Bearer <jwt_token>
 */
export async function POST(request: NextRequest) {
	try {
		// ------------------------------------------------------------------------
		// 1. Extract and validate body
		// ------------------------------------------------------------------------
		const body = await request.json();
		const { videoUrl } = body;

		if (!videoUrl) {
			return NextResponse.json(
				{ success: false, error: "Video URL is required" },
				{ status: 400 }
			);
		}

		// ------------------------------------------------------------------------
		// 2. Extract JWT from Authorization header
		// ------------------------------------------------------------------------
		const authHeader = request.headers.get("authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return NextResponse.json(
				{ success: false, error: "Authorization header is required" },
				{ status: 401 }
			);
		}
		const token = authHeader.replace("Bearer ", "");

		// ------------------------------------------------------------------------
		// 3. Validate token with Supabase
		// ------------------------------------------------------------------------
		const {
			data: { user },
			error: authError,
		} = await supabaseAdmin.auth.getUser(token);

		if (authError || !user) {
			return NextResponse.json(
				{ success: false, error: "Invalid or expired token" },
				{ status: 401 }
			);
		}

		// ------------------------------------------------------------------------
		// 4. Fetch the original manifest
		// ------------------------------------------------------------------------
		const manifestRes = await fetch(videoUrl, {
			method: "GET",
		});

		if (!manifestRes.ok) {
			const txt = await manifestRes.text();
			console.error(
				"[manifest] Failed to fetch manifest",
				videoUrl,
				manifestRes.status,
				txt
			);
			return NextResponse.json(
				{ success: false, error: "Unable to fetch manifest" },
				{ status: manifestRes.status }
			);
		}

		const originalManifest = await manifestRes.text();

		// Compute the manifest directory for URL resolution
		const manifestDir = videoUrl.substring(0, videoUrl.lastIndexOf("/") + 1);

		// Use configured APP_URL for API endpoints (e.g., /api/videos/aes-key)
		// Falls back to request origin for local development
		const serverOrigin =
			process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

		// ------------------------------------------------------------------------
		// 5. Rewrite manifest
		// ------------------------------------------------------------------------
		const rewrittenManifest = rewriteManifest(
			originalManifest,
			token,
			manifestDir,
			serverOrigin
		);

		// ------------------------------------------------------------------------
		// 6. Return rewritten manifest
		// ------------------------------------------------------------------------
		return new Response(rewrittenManifest, {
			status: 200,
			headers: {
				"Content-Type": "application/vnd.apple.mpegurl",
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("[manifest] API error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}

/**
 * Make a possibly-relative URL absolute using the manifest directory as base.
 */
function absolutize(ref: string, manifestDir: string): string {
	if (ref.startsWith("http")) return ref; // already absolute
	// otherwise treat as relative segment path
	return `${manifestDir}${ref}`;
}

/**
 * Create a proxy URL for a CloudFront resource.
 * This routes the request through our server to bypass CORS restrictions.
 */
function createProxyUrl(
	cloudFrontUrl: string,
	token: string,
	serverOrigin: string
): string {
	const encodedUrl = encodeURIComponent(cloudFrontUrl);
	return `${serverOrigin}/api/videos/proxy?url=${encodedUrl}&token=${token}`;
}

/**
 * Rewrite the manifest content to route all requests through our proxy.
 * - Segment URLs (.ts files) are routed through /api/videos/proxy
 * - AES key URIs are replaced with /api/videos/aes-key
 * This bypasses CloudFront CORS restrictions by having our server fetch the content.
 */
function rewriteManifest(
	manifest: string,
	token: string,
	manifestDir: string,
	serverOrigin: string
): string {
	return manifest
		.split("\n")
		.map((line) => {
			const trimmed = line.trim();

			// Key directive lines – replace URI attribute with our AES key endpoint
			if (trimmed.startsWith("#EXT-X-KEY")) {
				// Replace the original key URI with our secure endpoint
				return line.replace(
					/URI="([^"]+)"/g,
					() => `URI="${serverOrigin}/api/videos/aes-key?token=${token}"`
				);
			}

			// Skip comments / blank lines
			if (trimmed.startsWith("#") || trimmed === "") return line;

			// Segment or sub-playlist line - route through proxy
			const absoluteUrl = absolutize(trimmed, manifestDir);
			return createProxyUrl(absoluteUrl, token, serverOrigin);
		})
		.join("\n");
}

