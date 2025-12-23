"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Loader2, Play } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SecureHlsPreviewPlayerProps {
	videoCode: string;
	isOpen: boolean;
	onClose?: () => void;
	className?: string;
}

interface PlayerState {
	isLoading: boolean;
	error: string | null;
	isReady: boolean;
}

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

/**
 * SecureHlsPreviewPlayer
 *
 * A secure HLS video player that handles AES-128 encrypted content.
 * Uses the manifest rewriter API to inject authentication tokens into
 * the HLS manifest, enabling secure playback of encrypted videos.
 *
 * Security:
 * - Manifests are loaded via Blob URLs that are revoked on cleanup
 * - AES keys are fetched through authenticated API endpoints
 * - Raw CloudFront URLs are never passed directly to the video element
 */
export function SecureHlsPreviewPlayer({
	videoCode,
	isOpen,
	onClose,
	className = "",
}: SecureHlsPreviewPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const hlsRef = useRef<Hls | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	const [state, setState] = useState<PlayerState>({
		isLoading: true,
		error: null,
		isReady: false,
	});

	/**
	 * Cleanup function to destroy HLS instance and revoke Blob URL
	 */
	const cleanup = useCallback(() => {
		if (hlsRef.current) {
			hlsRef.current.destroy();
			hlsRef.current = null;
		}
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
	}, []);

	/**
	 * Initialize the video player with the secure manifest
	 */
	const initializePlayer = useCallback(async () => {
		if (!videoCode || !isOpen || !videoRef.current) return;

		// Reset state
		setState({ isLoading: true, error: null, isReady: false });

		// Cleanup any previous instance
		cleanup();

		try {
			// Check if HLS is supported
			if (!Hls.isSupported()) {
				throw new Error(
					"HLS is not supported in this browser. Please use Chrome or Firefox."
				);
			}

			// Validate CloudFront domain
			if (!CLOUDFRONT_DOMAIN) {
				throw new Error("Video streaming is not configured properly.");
			}

			// Get Supabase session
			const supabase = createClient();
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError) {
				throw new Error("Failed to get session: " + sessionError.message);
			}

			if (!session?.access_token) {
				throw new Error(
					"Authentication required. Please log in to preview videos."
				);
			}

			// Build the original manifest URL
			const videoUrl = `${CLOUDFRONT_DOMAIN}/${videoCode}/${videoCode}_.m3u8`;

			// Call the manifest rewriter API
			const manifestResponse = await fetch("/api/videos/manifest", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({ videoUrl }),
			});

			if (!manifestResponse.ok) {
				const errorData = await manifestResponse.json().catch(() => ({}));
				if (manifestResponse.status === 401) {
					throw new Error("Session expired. Please refresh the page.");
				}
				if (manifestResponse.status === 403) {
					throw new Error("You do not have permission to view this video.");
				}
				throw new Error(
					errorData.error || `Failed to load video manifest (${manifestResponse.status})`
				);
			}

			// Get the rewritten manifest as text
			const manifestText = await manifestResponse.text();

			// Create a Blob URL for the manifest
			const manifestBlob = new Blob([manifestText], {
				type: "application/vnd.apple.mpegurl",
			});
			const blobUrl = URL.createObjectURL(manifestBlob);
			blobUrlRef.current = blobUrl;

			// Initialize HLS.js
			const hls = new Hls({
				debug: false,
				enableWorker: true,
				lowLatencyMode: false,
				maxBufferLength: 30,
				maxBufferSize: 60 * 1000 * 1000,
				enableSoftwareAES: true,
				// Retry configuration for key loading
				keyLoadPolicy: {
					default: {
						maxTimeToFirstByteMs: 8000,
						maxLoadTimeMs: 20000,
						timeoutRetry: null,
						errorRetry: {
							maxNumRetry: 3,
							retryDelayMs: 1000,
							maxRetryDelayMs: 8000,
							backoff: "exponential",
						},
					},
				},
			});

			hlsRef.current = hls;

			// Event handlers
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				setState({ isLoading: false, error: null, isReady: true });
			});

			hls.on(Hls.Events.ERROR, (_, data) => {
				if (data.fatal) {
					let errorMessage = "Video playback error";

					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							errorMessage = "Network error while loading video";
							break;
						case Hls.ErrorTypes.MEDIA_ERROR:
							errorMessage = "Media playback error";
							// Try to recover from media errors
							hls.recoverMediaError();
							return;
						case Hls.ErrorTypes.KEY_SYSTEM_ERROR:
							errorMessage = "Video decryption failed";
							break;
						default:
							errorMessage = data.details || "Unknown playback error";
					}

					setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
				}
			});

			// Attach media and load source
			hls.attachMedia(videoRef.current);
			hls.loadSource(blobUrl);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to initialize video player";
			setState({ isLoading: false, error: errorMessage, isReady: false });
		}
	}, [videoCode, isOpen, cleanup]);

	// Initialize player when component mounts or videoCode changes
	useEffect(() => {
		if (isOpen && videoCode) {
			initializePlayer();
		}

		return () => {
			cleanup();
		};
	}, [isOpen, videoCode, initializePlayer, cleanup]);

	// Cleanup when component unmounts or closes
	useEffect(() => {
		if (!isOpen) {
			cleanup();
			setState({ isLoading: true, error: null, isReady: false });
		}
	}, [isOpen, cleanup]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className={`relative w-full ${className}`}>
			{/* Loading State */}
			{state.isLoading && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 rounded-lg z-10">
					<Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
					<p className="text-sm text-muted-foreground">Loading video...</p>
				</div>
			)}

			{/* Error State */}
			{state.error && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Playback Error</AlertTitle>
					<AlertDescription>{state.error}</AlertDescription>
				</Alert>
			)}

			{/* Video Element */}
			<div className="relative aspect-video bg-black rounded-lg overflow-hidden">
				{!state.error && (
					<video
						ref={videoRef}
						className="w-full h-full"
						controls
						playsInline
						autoPlay={false}
					/>
				)}

				{/* Placeholder when no video or error */}
				{(state.error || (!state.isReady && !state.isLoading)) && (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
						<Play className="h-12 w-12 text-muted-foreground mb-2" />
						<p className="text-sm text-muted-foreground">
							{state.error ? "Unable to play video" : "Video preview"}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

