"use client";

import { Clock, FileVideo, Hash } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { SecureHlsPreviewPlayer } from "@/components/video/SecureHlsPreviewPlayer";
import type { Video } from "@/types/exercise-program-types";
import { formatDuration } from "@/types/exercise-program-types";

interface VideoPreviewPanelProps {
	video: Video | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * VideoPreviewPanel
 *
 * A right-side sheet panel that displays a video preview along with
 * video metadata. Uses the SecureHlsPreviewPlayer for encrypted HLS playback.
 */
export function VideoPreviewPanel({
	video,
	open,
	onOpenChange,
}: VideoPreviewPanelProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto">
				<SheetHeader className="space-y-1">
					<SheetTitle className="flex items-center gap-2">
						<FileVideo className="h-5 w-5" />
						Video Preview
					</SheetTitle>
					<SheetDescription>
						Preview the video content before publishing
					</SheetDescription>
				</SheetHeader>

				{video && (
					<div className="mt-6 space-y-6">
						{/* Video Player */}
						<SecureHlsPreviewPlayer
							videoCode={video.code}
							isOpen={open}
							onClose={() => onOpenChange(false)}
						/>

						{/* Video Metadata */}
						<div className="space-y-4">
							{/* Title */}
							<div>
								<h3 className="text-lg font-semibold">{video.title}</h3>
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
								<div className="space-y-2">
									<h4 className="text-sm font-medium">Description</h4>
									<p className="text-sm text-muted-foreground">
										{video.description}
									</p>
								</div>
							)}

							{video.description_ar && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium">الوصف</h4>
									<p className="text-sm text-muted-foreground" dir="rtl">
										{video.description_ar}
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{!video && (
					<div className="flex items-center justify-center h-64">
						<p className="text-muted-foreground">No video selected</p>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

