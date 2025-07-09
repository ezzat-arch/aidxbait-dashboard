"use client";

import { useState, useEffect } from "react";
import {
	Plus,
	MoreHorizontal,
	Edit,
	Trash2,
	PlayCircle,
	Clock,
	Video as VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";

import { toast, useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import { ProgramFormDialog } from "./program-form-dialog";
import { ProgramVideosModal } from "./program-videos-modal";
import type { ProgramWithVideos, Video } from "@/types/exercise-program-types";
import { formatDuration } from "@/types/exercise-program-types";

export function ProgramsTab() {
	const [programs, setPrograms] = useState<ProgramWithVideos[]>([]);
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedProgram, setSelectedProgram] =
		useState<ProgramWithVideos | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showManageVideosModal, setShowManageVideosModal] = useState(false);

	const { toast } = useToast();

	useEffect(() => {
		fetchPrograms();
		fetchAllVideos();
	}, []);

	const fetchPrograms = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/exercise-programs/programs");
			if (!response.ok) throw new Error("Failed to fetch programs");
			const result = await response.json();
			setPrograms(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load programs",
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
			setVideos(result.data);
		} catch (error) {
			console.error("Failed to fetch videos:", error);
		}
	};

	const handleCreateProgram = async (data: any) => {
		try {
			const response = await fetch(
				"/api/protected/exercise-programs/programs",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create program");
			}

			toast({
				title: "Success",
				description: "Program created successfully",
			});

			setShowCreateModal(false);
			fetchPrograms();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create program",
			});
			throw error;
		}
	};

	const handleEditProgram = async (data: any) => {
		if (!selectedProgram) return;

		try {
			const response = await fetch(
				`/api/protected/exercise-programs/programs/${selectedProgram.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update program");
			}

			toast({
				title: "Success",
				description: "Program updated successfully",
			});

			setShowEditModal(false);
			setSelectedProgram(null);
			fetchPrograms();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to update program",
			});
			throw error;
		}
	};

	const handleDeleteProgram = async () => {
		if (!selectedProgram) return;

		try {
			const response = await fetch(
				`/api/protected/exercise-programs/programs/${selectedProgram.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete program");
			}

			toast({
				title: "Success",
				description: "Program deleted successfully",
			});

			setShowDeleteDialog(false);
			setSelectedProgram(null);
			fetchPrograms();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete program",
			});
		}
	};

	const openEditModal = (program: ProgramWithVideos) => {
		setSelectedProgram(program);
		setShowEditModal(true);
	};

	const openDeleteDialog = (program: ProgramWithVideos) => {
		setSelectedProgram(program);
		setShowDeleteDialog(true);
	};

	const openManageVideosModal = (program: ProgramWithVideos) => {
		setSelectedProgram(program);
		setShowManageVideosModal(true);
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PlayCircle className="h-5 w-5" />
						Programs
					</CardTitle>
					<CardDescription>
						Manage exercise programs and assign videos
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
								<PlayCircle className="h-5 w-5" />
								Programs ({programs.length})
							</CardTitle>
							<CardDescription>
								Manage exercise programs and assign videos
							</CardDescription>
						</div>
						<PermissionGate permissions={[Permission.CreateExercisePrograms]}>
							<Button onClick={() => setShowCreateModal(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Add Program
							</Button>
						</PermissionGate>
					</div>
				</CardHeader>
				<CardContent>
					{programs.length === 0 ? (
						<div className="text-center py-8">
							<PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-2">No programs found</h3>
							<p className="text-muted-foreground mb-4">
								Start by creating your first exercise program.
							</p>
							<PermissionGate permissions={[Permission.CreateExercisePrograms]}>
								<Button onClick={() => setShowCreateModal(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Add Program
								</Button>
							</PermissionGate>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Thumbnail</TableHead>
										<TableHead>Title</TableHead>
										<TableHead>Joint</TableHead>
										<TableHead>Price</TableHead>
										<TableHead>Videos</TableHead>
										<TableHead>Duration</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{programs.map((program) => (
										<TableRow key={program.id}>
											<TableCell>
												<div className="w-16 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
													{program.thumbnail_url ? (
														<img
															src={program.thumbnail_url}
															alt={program.title}
															className="w-full h-full object-cover"
															onError={(e) => {
																e.currentTarget.src = "/placeholder.svg";
															}}
														/>
													) : (
														<VideoIcon className="h-4 w-4 text-muted-foreground" />
													)}
												</div>
											</TableCell>
											<TableCell>
												<div>
													<div className="font-medium">{program.title}</div>
													<div
														className="text-sm text-muted-foreground"
														dir="rtl"
													>
														{program.title_ar}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{program.joints?.name || "N/A"}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													{program.price.toFixed(2)} EGP
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<VideoIcon className="h-3 w-3" />
													{program.video_count || 0}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{program.total_duration
														? formatDuration(program.total_duration)
														: "0s"}
												</div>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<PermissionGate
															permissions={[Permission.UpdateExercisePrograms]}
														>
															<DropdownMenuItem
																onClick={() => openManageVideosModal(program)}
															>
																<VideoIcon className="h-4 w-4 mr-2" />
																Manage Videos
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => openEditModal(program)}
															>
																<Edit className="h-4 w-4 mr-2" />
																Edit
															</DropdownMenuItem>
														</PermissionGate>
														<PermissionGate
															permissions={[Permission.DeleteExercisePrograms]}
														>
															<DropdownMenuItem
																onClick={() => openDeleteDialog(program)}
																className="text-destructive"
															>
																<Trash2 className="h-4 w-4 mr-2" />
																Delete
															</DropdownMenuItem>
														</PermissionGate>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Program Modal */}
			<ProgramFormDialog
				open={showCreateModal}
				onOpenChange={setShowCreateModal}
				onSubmit={handleCreateProgram}
				title="Create New Program"
				description="Create a new exercise program"
			/>

			{/* Edit Program Modal */}
			<ProgramFormDialog
				open={showEditModal}
				onOpenChange={setShowEditModal}
				onSubmit={handleEditProgram}
				title="Edit Program"
				description="Update program information"
				defaultValues={selectedProgram || undefined}
				isEdit={true}
			/>

			{/* Manage Videos Modal */}
			<ProgramVideosModal
				open={showManageVideosModal}
				onOpenChange={setShowManageVideosModal}
				program={selectedProgram}
				onVideoAdded={fetchPrograms}
				onVideoRemoved={fetchPrograms}
				onVideoReordered={fetchPrograms}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteProgram}
				title="Delete Program"
				description={
					selectedProgram
						? `Are you sure you want to delete "${selectedProgram.title}"? This will also remove all video assignments from this program. This action cannot be undone.`
						: ""
				}
			/>
		</>
	);
}
