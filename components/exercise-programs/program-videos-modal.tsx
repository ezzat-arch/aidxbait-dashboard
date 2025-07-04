"use client";

import { useState, useEffect } from "react";
import {
	Plus,
	X,
	Clock,
	VideoIcon,
	GripVertical,
	Search,
	Filter,
	Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	useSortable,
	SortableContext as SortableContextType,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
	Video,
	VideoWithProgramDetails,
} from "@/types/exercise-program-types";
import { formatDuration } from "@/types/exercise-program-types";

interface ProgramVideosModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	program: { id: number; title: string } | null;
	onVideoAdded: () => void;
	onVideoRemoved: () => void;
	onVideoReordered: () => void;
}

interface SortableVideoItemProps {
	video: VideoWithProgramDetails & { isPending?: boolean };
	onRemove: (videoId: number) => void;
	isPendingRemoval?: boolean;
}

function SortableVideoItem({
	video,
	onRemove,
	isPendingRemoval,
}: SortableVideoItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: video.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.8 : isPendingRemoval ? 0.5 : 1,
		zIndex: isDragging ? 50 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center justify-between p-3 border rounded-lg bg-card transition-all duration-200 ${
				isDragging ? "shadow-lg border-primary scale-105" : "hover:shadow-md"
			} ${
				video.isPending ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
			} ${
				isPendingRemoval ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""
			}`}
		>
			<div className="flex items-center gap-3">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
				>
					<GripVertical className="h-4 w-4" />
				</div>
				<div className="flex-1">
					<div className="font-medium flex items-center gap-2">
						{video.title}
						{video.isPending && (
							<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
								Pending Addition
							</span>
						)}
						{isPendingRemoval && (
							<span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded dark:bg-red-900 dark:text-red-300">
								Pending Removal
							</span>
						)}
					</div>
					<div className="text-sm text-muted-foreground" dir="rtl">
						{video.title_ar}
					</div>
					<div className="text-sm text-muted-foreground flex items-center gap-1">
						<Clock className="h-3 w-3" />
						{formatDuration(video.duration)}
					</div>
				</div>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => onRemove(video.id)}
				className="text-destructive hover:text-destructive"
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

export function ProgramVideosModal({
	open,
	onOpenChange,
	program,
	onVideoAdded,
	onVideoRemoved,
	onVideoReordered,
}: ProgramVideosModalProps) {
	const [programVideos, setProgramVideos] = useState<VideoWithProgramDetails[]>(
		[]
	);
	const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [activeId, setActiveId] = useState<string | number | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	// Track pending changes for batch operations
	const [pendingAdditions, setPendingAdditions] = useState<Set<number>>(
		new Set()
	);
	const [pendingRemovals, setPendingRemovals] = useState<Set<number>>(
		new Set()
	);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const { toast } = useToast();

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Get unique categories for the filter dropdown
	const categories = Array.from(
		new Set(availableVideos.map((video) => video.category))
	).sort();

	// Calculate effective program videos (current + pending additions - pending removals)
	const effectiveProgramVideos = programVideos.filter(
		(video) => !pendingRemovals.has(video.id)
	);

	// Get pending addition videos for display
	const pendingAdditionVideos = availableVideos
		.filter((video) => pendingAdditions.has(video.id))
		.map((video) => ({ ...video, isPending: true }));

	// Combine current videos and pending additions for display
	const videosToDisplay = [
		...effectiveProgramVideos.map((video) => ({ ...video, isPending: false })),
		...pendingAdditionVideos,
	];

	// Filter available videos based on search, category, and exclude videos already in program
	const filteredAvailableVideos = availableVideos
		.filter((video) => {
			// Exclude videos already in the program (unless pending removal)
			const isNotInProgram = !effectiveProgramVideos.some(
				(pv) => pv.id === video.id
			);

			const matchesSearch =
				video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				video.title_ar.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesCategory =
				selectedCategory === "all" || video.category === selectedCategory;

			return isNotInProgram && matchesSearch && matchesCategory;
		})
		.sort((a, b) => a.code.localeCompare(b.code)); // Sort by code ascending

	useEffect(() => {
		if (open && program?.id) {
			fetchProgramVideos();
			fetchAllVideos();
			// Reset filters and pending states when modal opens
			setSearchTerm("");
			setSelectedCategory("all");
			setPendingAdditions(new Set());
			setPendingRemovals(new Set());
			setHasUnsavedChanges(false);
		}
	}, [open, program?.id]);

	const fetchProgramVideos = async () => {
		if (!program?.id) return;

		try {
			setLoading(true);
			const response = await fetch(
				`/api/protected/exercise-programs/programs/${program.id}/videos`
			);
			if (!response.ok) throw new Error("Failed to fetch program videos");
			const result = await response.json();
			setProgramVideos(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load program videos",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchAllVideos = async () => {
		try {
			const response = await fetch("/api/protected/exercise-programs/videos");
			if (!response.ok) throw new Error("Failed to fetch videos");
			const result = await response.json();

			// Store all videos - filtering will be done separately
			setAvailableVideos(result.data);
		} catch (error) {
			console.error("Failed to fetch videos:", error);
		}
	};

	const handleAddVideoToProgram = (videoId: number) => {
		// Add to pending additions and remove from pending removals if present
		setPendingAdditions((prev) => new Set([...prev, videoId]));
		setPendingRemovals((prev) => {
			const newSet = new Set(prev);
			newSet.delete(videoId);
			return newSet;
		});
		setHasUnsavedChanges(true);

		toast({
			title: "Video staged",
			description: "Video will be added when you save changes",
		});
	};

	const handleRemoveVideoFromProgram = (videoId: number) => {
		// Add to pending removals and remove from pending additions if present
		setPendingRemovals((prev) => new Set([...prev, videoId]));
		setPendingAdditions((prev) => {
			const newSet = new Set(prev);
			newSet.delete(videoId);
			return newSet;
		});
		setHasUnsavedChanges(true);

		toast({
			title: "Video staged for removal",
			description: "Video will be removed when you save changes",
		});
	};

	const handleSaveChanges = async () => {
		if (!program?.id || (!pendingAdditions.size && !pendingRemovals.size))
			return;

		try {
			setSaving(true);

			// Process removals first
			for (const videoId of pendingRemovals) {
				const response = await fetch(
					`/api/protected/exercise-programs/programs/${program.id}/videos/${videoId}`,
					{
						method: "DELETE",
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || "Failed to remove video from program"
					);
				}
			}

			// Process additions
			for (const videoId of pendingAdditions) {
				const response = await fetch(
					`/api/protected/exercise-programs/programs/${program.id}/videos`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ video_id: videoId }),
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to add video to program");
				}
			}

			toast({
				title: "Success",
				description: `${pendingAdditions.size} videos added, ${pendingRemovals.size} videos removed`,
			});

			// Reset pending states
			setPendingAdditions(new Set());
			setPendingRemovals(new Set());
			setHasUnsavedChanges(false);

			// Refresh data
			await fetchProgramVideos();
			await fetchAllVideos();
			onVideoAdded(); // Notify parent component
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to save changes",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleDiscardChanges = () => {
		setPendingAdditions(new Set());
		setPendingRemovals(new Set());
		setHasUnsavedChanges(false);

		toast({
			title: "Changes discarded",
			description: "All pending changes have been discarded",
		});
	};

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		setActiveId(null);

		if (!over || active.id === over.id) {
			return;
		}

		// Only allow reordering of saved videos, not pending ones
		const activeVideo = videosToDisplay.find((v) => v.id === active.id);
		const overVideo = videosToDisplay.find((v) => v.id === over.id);

		if (activeVideo?.isPending || overVideo?.isPending) {
			toast({
				title: "Cannot reorder",
				description: "Please save your changes before reordering videos",
			});
			return;
		}

		const oldIndex = programVideos.findIndex((item) => item.id === active.id);
		const newIndex = programVideos.findIndex((item) => item.id === over.id);

		const newOrder = arrayMove(programVideos, oldIndex, newIndex);
		setProgramVideos(newOrder);

		// Update the sort order in the database
		await handleReorderVideos(newOrder);
	};

	const handleReorderVideos = async (newOrder: VideoWithProgramDetails[]) => {
		if (!program?.id) return;

		try {
			const videoOrders = newOrder.map((video, index) => ({
				video_id: video.id,
				sort_order: index + 1,
			}));

			const response = await fetch(
				`/api/protected/exercise-programs/programs/${program.id}/videos`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ video_orders: videoOrders }),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to reorder videos");
			}

			toast({
				title: "Success",
				description: "Video order updated successfully",
			});

			onVideoReordered();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to reorder videos",
			});

			// Revert the order on error
			await fetchProgramVideos();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Manage Videos: {program?.title}</DialogTitle>
					<DialogDescription>
						Add, remove, and reorder videos in this program by dragging
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Current Videos */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-medium">
								Current Videos (
								{effectiveProgramVideos.length + pendingAdditions.size})
								{hasUnsavedChanges && (
									<span className="text-sm text-muted-foreground ml-2">
										({pendingAdditions.size} pending addition
										{pendingAdditions.size !== 1 ? "s" : ""},{" "}
										{pendingRemovals.size} pending removal
										{pendingRemovals.size !== 1 ? "s" : ""})
									</span>
								)}
							</h3>
							{hasUnsavedChanges && (
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleDiscardChanges}
										disabled={saving}
									>
										Discard Changes
									</Button>
									<Button
										size="sm"
										onClick={handleSaveChanges}
										disabled={saving}
									>
										{saving ? (
											"Saving..."
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</div>
							)}
						</div>
						{loading ? (
							<div className="flex items-center justify-center p-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							</div>
						) : videosToDisplay.length === 0 ? (
							<div className="text-center py-12">
								<VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground text-lg mb-2">
									No videos in this program yet
								</p>
								<p className="text-muted-foreground text-sm">
									Add some videos from the section below to get started
								</p>
							</div>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={videosToDisplay.map((video) => video.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className="space-y-2">
										{videosToDisplay.map((video) => (
											<SortableVideoItem
												key={video.id}
												video={video}
												onRemove={handleRemoveVideoFromProgram}
												isPendingRemoval={pendingRemovals.has(video.id)}
											/>
										))}
									</div>
								</SortableContext>
								<DragOverlay>
									{activeId ? (
										<div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-lg border-primary">
											<div className="flex items-center gap-3">
												<div className="cursor-grab p-1 text-muted-foreground">
													<GripVertical className="h-4 w-4" />
												</div>
												<div className="flex-1">
													{(() => {
														const activeVideo = videosToDisplay.find(
															(video) => video.id === activeId
														);
														return activeVideo ? (
															<>
																<div className="font-medium">
																	{activeVideo.title}
																</div>
																<div
																	className="text-sm text-muted-foreground"
																	dir="rtl"
																>
																	{activeVideo.title_ar}
																</div>
																<div className="text-sm text-muted-foreground flex items-center gap-1">
																	<Clock className="h-3 w-3" />
																	{formatDuration(activeVideo.duration)}
																</div>
															</>
														) : null;
													})()}
												</div>
											</div>
										</div>
									) : null}
								</DragOverlay>
							</DndContext>
						)}
					</div>

					{/* Available Videos to Add */}
					<div className="border-t pt-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-medium">
								Add Videos ({filteredAvailableVideos.length} of{" "}
								{
									availableVideos.filter(
										(video) =>
											!effectiveProgramVideos.some(
												(pv) => pv.id === video.id
											) && !pendingAdditions.has(video.id)
									).length
								}{" "}
								available)
							</h3>
							<div className="flex items-center gap-3">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search videos..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-9 w-64"
									/>
								</div>
								<Select
									value={selectedCategory}
									onValueChange={setSelectedCategory}
								>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="Filter by category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Categories</SelectItem>
										{categories.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{filteredAvailableVideos.length === 0 ? (
							<div className="text-center py-12">
								<VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground text-lg mb-2">
									{availableVideos.filter(
										(video) =>
											!effectiveProgramVideos.some(
												(pv) => pv.id === video.id
											) && !pendingAdditions.has(video.id)
									).length === 0
										? "All videos are already in this program"
										: "No videos match your search criteria"}
								</p>
								{availableVideos.filter(
									(video) =>
										!effectiveProgramVideos.some((pv) => pv.id === video.id) &&
										!pendingAdditions.has(video.id)
								).length > 0 && (
									<p className="text-muted-foreground text-sm">
										Try adjusting your search or category filter
									</p>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-80 overflow-y-auto border rounded-lg p-4 bg-muted/10">
								{filteredAvailableVideos.map((video) => (
									<div
										key={video.id}
										className="flex flex-col p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
									>
										<div className="flex items-center gap-2 mb-3">
											<VideoIcon className="h-5 w-5 text-primary" />
											<div className="flex-1 min-w-0">
												<div className="font-medium truncate">
													{video.title}
												</div>
												<div
													className="text-sm text-muted-foreground truncate"
													dir="rtl"
												>
													{video.title_ar}
												</div>
											</div>
										</div>
										<div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
											<span className="px-2 py-1 bg-muted rounded text-xs">
												{video.category}
											</span>
											<div className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{formatDuration(video.duration)}
											</div>
										</div>
										<Button
											size="sm"
											onClick={() => handleAddVideoToProgram(video.id)}
											disabled={loading || pendingAdditions.has(video.id)}
											className="w-full"
											variant={
												pendingAdditions.has(video.id) ? "secondary" : "default"
											}
										>
											<Plus className="h-4 w-4 mr-2" />
											{pendingAdditions.has(video.id)
												? "Added to Program"
												: "Add to Program"}
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
