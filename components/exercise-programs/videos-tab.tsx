"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Plus,
	MoreHorizontal,
	Edit,
	Trash2,
	Play,
	Clock,
	FileVideo,
	Search,
	Filter,
	X,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { SortConfig, sortData, toggleSort } from "@/lib/table-sort";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast, useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import { VideoFormDialog } from "./video-form-dialog";
import type { Video } from "@/types/exercise-program-types";
import { formatDuration } from "@/types/exercise-program-types";

interface GroupedVideos {
	[category: string]: Video[];
}

export function VideosTab() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Filter and search states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		column: null,
		direction: null,
	});

	const { toast } = useToast();

	useEffect(() => {
		fetchVideos();
	}, []);

	// Get unique categories from videos
	const availableCategories = useMemo(() => {
		const categories = new Set(videos.map((video) => video.category));
		return Array.from(categories).sort();
	}, [videos]);

	// Filter and sort videos
	const { filteredVideos, groupedVideos } = useMemo(() => {
		let filtered = videos;

		// Apply category filter
		if (selectedCategories.length > 0) {
			filtered = filtered.filter((video) =>
				selectedCategories.includes(video.category)
			);
		}

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(video) =>
					video.title.toLowerCase().includes(query) ||
					video.title_ar.toLowerCase().includes(query) ||
					video.code.toLowerCase().includes(query) ||
					(video.description &&
						video.description.toLowerCase().includes(query)) ||
					(video.description_ar &&
						video.description_ar.toLowerCase().includes(query))
			);
		}

		// Apply column sorting if set, otherwise sort by code
		if (sortConfig.column && sortConfig.direction) {
			filtered = sortData(filtered, sortConfig, {
				title: (item) => item.title,
				duration: (item) => item.duration,
				size: (item) => item.size_mb,
				code: (item) => item.code,
			});
		} else {
			// Default sort by code alphabetically
			filtered = [...filtered].sort((a, b) => a.code.localeCompare(b.code));
		}

		// Group by category
		const grouped: GroupedVideos = filtered.reduce((acc, video) => {
			if (!acc[video.category]) {
				acc[video.category] = [];
			}
			acc[video.category].push(video);
			return acc;
		}, {} as GroupedVideos);

		// Sort categories alphabetically
		const sortedGrouped: GroupedVideos = {};
		Object.keys(grouped)
			.sort()
			.forEach((category) => {
				sortedGrouped[category] = grouped[category];
			});

		return {
			filteredVideos: filtered,
			groupedVideos: sortedGrouped,
		};
	}, [videos, selectedCategories, searchQuery, sortConfig]);

	const fetchVideos = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/exercise-programs/videos");
			if (!response.ok) throw new Error("Failed to fetch videos");
			const result = await response.json();
			setVideos(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load videos",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCreateVideo = async (data: any) => {
		try {
			const response = await fetch("/api/protected/exercise-programs/videos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create video");
			}

			toast({
				title: "Success",
				description: "Video created successfully",
			});

			setShowCreateModal(false);
			fetchVideos();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create video",
			});
			throw error;
		}
	};

	const handleEditVideo = async (data: any) => {
		if (!selectedVideo) return;

		try {
			const response = await fetch(
				`/api/protected/exercise-programs/videos/${selectedVideo.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update video");
			}

			toast({
				title: "Success",
				description: "Video updated successfully",
			});

			setShowEditModal(false);
			setSelectedVideo(null);
			fetchVideos();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to update video",
			});
			throw error;
		}
	};

	const handleDeleteVideo = async () => {
		if (!selectedVideo) return;

		try {
			const response = await fetch(
				`/api/protected/exercise-programs/videos/${selectedVideo.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete video");
			}

			toast({
				title: "Success",
				description: "Video deleted successfully",
			});

			setShowDeleteDialog(false);
			setSelectedVideo(null);
			fetchVideos();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete video",
			});
		}
	};

	const openEditModal = (video: Video) => {
		setSelectedVideo(video);
		setShowEditModal(true);
	};

	const openDeleteDialog = (video: Video) => {
		setSelectedVideo(video);
		setShowDeleteDialog(true);
	};

	const formatFileSize = (sizeInMB: number): string => {
		if (sizeInMB < 1024) {
			return `${sizeInMB.toFixed(1)} MB`;
		}
		return `${(sizeInMB / 1024).toFixed(1)} GB`;
	};

	const toggleCategory = (category: string) => {
		setSelectedCategories((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category]
		);
	};

	const clearAllFilters = () => {
		setSelectedCategories([]);
		setSearchQuery("");
	};

	const hasActiveFilters = selectedCategories.length > 0 || searchQuery.trim();

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileVideo className="h-5 w-5" />
						Videos
					</CardTitle>
					<CardDescription>
						Manage exercise videos and their content
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<FileVideo className="h-5 w-5" />
								Videos ({filteredVideos.length})
							</CardTitle>
							<CardDescription>
								Manage exercise videos and their content
							</CardDescription>
						</div>
						<PermissionGate permissions={[Permission.ManageVideos]}>
							<Button onClick={() => setShowCreateModal(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Add Video
							</Button>
						</PermissionGate>
					</div>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex flex-col gap-4 mb-6">
						<div className="flex flex-col sm:flex-row gap-4">
							{/* Search Input */}
							<div className="flex-1 relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by title, code, or description..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>

							{/* Category Filter */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="min-w-[200px] justify-start"
									>
										<Filter className="h-4 w-4 mr-2" />
										Categories
										{selectedCategories.length > 0 && (
											<Badge variant="secondary" className="ml-2">
												{selectedCategories.length}
											</Badge>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-64" align="end">
									<DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{availableCategories.map((category) => (
										<DropdownMenuCheckboxItem
											key={category}
											checked={selectedCategories.includes(category)}
											onCheckedChange={() => toggleCategory(category)}
										>
											{category}
										</DropdownMenuCheckboxItem>
									))}
									{availableCategories.length === 0 && (
										<div className="px-2 py-1.5 text-sm text-muted-foreground">
											No categories available
										</div>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Active Filters */}
						{hasActiveFilters && (
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-sm text-muted-foreground">
									Active filters:
								</span>

								{searchQuery.trim() && (
									<Badge variant="secondary" className="gap-1">
										Search: "{searchQuery}"
										<X
											className="h-3 w-3 cursor-pointer"
											onClick={() => setSearchQuery("")}
										/>
									</Badge>
								)}

								{selectedCategories.map((category) => (
									<Badge key={category} variant="secondary" className="gap-1">
										{category}
										<X
											className="h-3 w-3 cursor-pointer"
											onClick={() => toggleCategory(category)}
										/>
									</Badge>
								))}

								<Button
									variant="ghost"
									size="sm"
									onClick={clearAllFilters}
									className="h-auto p-1 text-muted-foreground hover:text-foreground"
								>
									Clear all
								</Button>
							</div>
						)}
					</div>

					{filteredVideos.length === 0 ? (
						<div className="text-center py-8">
							<FileVideo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-2">
								{hasActiveFilters
									? "No videos match your filters"
									: "No videos found"}
							</h3>
							<p className="text-muted-foreground mb-4">
								{hasActiveFilters
									? "Try adjusting your search or filter criteria."
									: "Start by adding your first exercise video."}
							</p>
							{!hasActiveFilters && (
								<PermissionGate permissions={[Permission.ManageVideos]}>
									<Button onClick={() => setShowCreateModal(true)}>
										<Plus className="h-4 w-4 mr-2" />
										Add Video
									</Button>
								</PermissionGate>
							)}
						</div>
					) : (
						<div className="space-y-6">
							{Object.entries(groupedVideos).map(
								([category, categoryVideos]) => (
									<div key={category} className="space-y-4">
										<div className="flex items-center gap-2">
											<h3 className="text-lg font-semibold text-foreground">
												{category}
											</h3>
											<Badge variant="outline">
												{categoryVideos.length} video
												{categoryVideos.length !== 1 ? "s" : ""}
											</Badge>
										</div>

										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead
															className="cursor-pointer select-none hover:bg-muted/50"
															onClick={() =>
																setSortConfig(toggleSort(sortConfig, "title"))
															}
														>
															<div className="flex items-center gap-1">
																Title
																{sortConfig.column === "title" ? (
																	sortConfig.direction === "asc" ? (
																		<ArrowUp className="h-4 w-4" />
																	) : (
																		<ArrowDown className="h-4 w-4" />
																	)
																) : (
																	<ArrowUpDown className="h-4 w-4 opacity-50" />
																)}
															</div>
														</TableHead>
														<TableHead
															className="cursor-pointer select-none hover:bg-muted/50"
															onClick={() =>
																setSortConfig(
																	toggleSort(sortConfig, "duration")
																)
															}
														>
															<div className="flex items-center gap-1">
																Duration
																{sortConfig.column === "duration" ? (
																	sortConfig.direction === "asc" ? (
																		<ArrowUp className="h-4 w-4" />
																	) : (
																		<ArrowDown className="h-4 w-4" />
																	)
																) : (
																	<ArrowUpDown className="h-4 w-4 opacity-50" />
																)}
															</div>
														</TableHead>
														<TableHead
															className="cursor-pointer select-none hover:bg-muted/50"
															onClick={() =>
																setSortConfig(toggleSort(sortConfig, "size"))
															}
														>
															<div className="flex items-center gap-1">
																Size
																{sortConfig.column === "size" ? (
																	sortConfig.direction === "asc" ? (
																		<ArrowUp className="h-4 w-4" />
																	) : (
																		<ArrowDown className="h-4 w-4" />
																	)
																) : (
																	<ArrowUpDown className="h-4 w-4 opacity-50" />
																)}
															</div>
														</TableHead>
														<TableHead
															className="cursor-pointer select-none hover:bg-muted/50"
															onClick={() =>
																setSortConfig(toggleSort(sortConfig, "code"))
															}
														>
															<div className="flex items-center gap-1">
																Code
																{sortConfig.column === "code" ? (
																	sortConfig.direction === "asc" ? (
																		<ArrowUp className="h-4 w-4" />
																	) : (
																		<ArrowDown className="h-4 w-4" />
																	)
																) : (
																	<ArrowUpDown className="h-4 w-4 opacity-50" />
																)}
															</div>
														</TableHead>
														<TableHead className="text-right">
															Actions
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{categoryVideos.map((video) => (
														<TableRow key={video.id}>
															<TableCell>
																<div>
																	<div className="font-medium">
																		{video.title}
																	</div>
																	<div
																		className="text-sm text-muted-foreground"
																		dir="rtl"
																	>
																		{video.title_ar}
																	</div>
																</div>
															</TableCell>
															<TableCell>
																<div className="flex items-center gap-1">
																	<Clock className="h-3 w-3" />
																	{formatDuration(video.duration)}
																</div>
															</TableCell>
															<TableCell>
																{formatFileSize(video.size_mb)}
															</TableCell>
															<TableCell>
																<Badge variant="outline">{video.code}</Badge>
															</TableCell>
															<TableCell className="text-right">
																<PermissionGate
																	permissions={[Permission.ManageVideos]}
																>
																	<DropdownMenu>
																		<DropdownMenuTrigger asChild>
																			<Button variant="ghost" size="sm">
																				<MoreHorizontal className="h-4 w-4" />
																			</Button>
																		</DropdownMenuTrigger>
																		<DropdownMenuContent align="end">
																			<DropdownMenuItem
																				onClick={() => openEditModal(video)}
																			>
																				<Edit className="h-4 w-4 mr-2" />
																				Edit
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={() => openDeleteDialog(video)}
																				className="text-destructive"
																			>
																				<Trash2 className="h-4 w-4 mr-2" />
																				Delete
																			</DropdownMenuItem>
																		</DropdownMenuContent>
																	</DropdownMenu>
																</PermissionGate>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								)
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Video Modal */}
			<VideoFormDialog
				open={showCreateModal}
				onOpenChange={setShowCreateModal}
				onSubmit={handleCreateVideo}
				title="Create New Video"
				description="Add a new exercise video to the library"
			/>

			{/* Edit Video Modal */}
			<VideoFormDialog
				open={showEditModal}
				onOpenChange={setShowEditModal}
				onSubmit={handleEditVideo}
				title="Edit Video"
				description="Update video information"
				defaultValues={selectedVideo || undefined}
				isEdit={true}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteVideo}
				title="Delete Video"
				description={
					selectedVideo
						? `Are you sure you want to delete "${selectedVideo.title}"? This action cannot be undone.`
						: ""
				}
			/>
		</>
	);
}
