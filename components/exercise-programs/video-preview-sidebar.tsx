"use client";

import { Clock, FileVideo, Hash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SecureHlsPreviewPlayer } from "@/components/video/SecureHlsPreviewPlayer";
import type { Video } from "@/types/exercise-program-types";
import { formatDuration } from "@/types/exercise-program-types";

interface VideoPreviewSidebarProps {
	video: Video | null;
	onClose: () => void;
}

/**
 * VideoPreviewSidebar
 *
 * A non-modal sidebar panel that displays a video preview alongside
 * the main content. Uses the SecureHlsPreviewPlayer for encrypted HLS playback.
 * This allows users to interact with the table while watching the video.
 */
export function VideoPreviewSidebar({
	video,
	onClose,
}: VideoPreviewSidebarProps) {
	if (!video) return null;

	return (
		<div className="w-[420px] flex-shrink-0 border-l bg-background flex flex-col sticky top-0 h-screen max-h-screen animate-in slide-in-from-right-5 duration-300">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<FileVideo className="h-5 w-5 text-primary" />
					<h3 className="font-semibold">Video Preview</h3>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-8 w-8"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Close preview</span>
				</Button>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-4">
					{/* Video Player */}
					<SecureHlsPreviewPlayer
						videoCode={video.code}
						isOpen={true}
						onClose={onClose}
					/>

					{/* Video Metadata */}
					<div className="space-y-3">
						{/* Title */}
						<div>
							<h4 className="text-base font-semibold">{video.title}</h4>
							<p className="text-sm text-muted-foreground" dir="rtl">
								{video.title_ar}
							</p>
						</div>

						{/* Metadata badges */}
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline" className="gap-1">
								<Hash className="h-3 w-3" />
								{video.code}
							</Badge>
							<Badge variant="secondary" className="gap-1">
								<Clock className="h-3 w-3" />
								{formatDuration(video.duration)}
							</Badge>
							<Badge variant="outline">{video.category}</Badge>
						</div>

						{/* Description */}
						{video.description && (
							<div className="space-y-1">
								<h5 className="text-sm font-medium">Description</h5>
								<p className="text-sm text-muted-foreground">
									{video.description}
								</p>
							</div>
						)}

						{video.description_ar && (
							<div className="space-y-1">
								<h5 className="text-sm font-medium">الوصف</h5>
								<p className="text-sm text-muted-foreground" dir="rtl">
									{video.description_ar}
								</p>
							</div>
						)}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}

