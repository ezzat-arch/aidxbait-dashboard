"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	Plus,
	Search,
	Clock,
	VideoIcon,
	Edit,
	Trash2,
	ChevronDown,
	ChevronRight,
	ArrowUp,
	ArrowDown,
	Save,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import { UnsavedChangesAlert } from "./unsaved-changes-alert";
import type {
	Video,
	ExerciseWithVideo,
	CreateProgramExerciseData,
	LocalExercise,
	LocalWeekGroup,
	PendingExercise,
	ExerciseChanges,
	BulkSyncExercisesPayload,
	TempExerciseId,
} from "@/types/exercise-program-types";
import {
	formatDuration,
	formatVolume,
	groupLocalExercisesByWeeks,
	generateTempId,
	isPendingExercise,
	getExerciseIdentifier,
	hasUnsavedChanges as checkHasUnsavedChanges,
	createEmptyChanges,
} from "@/types/exercise-program-types";

interface ProgramExercisesModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	program: { id: number; title: string } | null;
	onExerciseChanged: () => void;
}

export function ProgramExercisesModal({
	open,
	onOpenChange,
	program,
	onExerciseChanged,
}: ProgramExercisesModalProps) {
	// Original exercises from DB (reference for detecting changes)
	const [originalExercises, setOriginalExercises] = useState<
		ExerciseWithVideo[]
	>([]);

	// Working copy with all local modifications (both existing and pending)
	const [localExercises, setLocalExercises] = useState<LocalExercise[]>([]);

	// Track pending changes for bulk save
	const [changes, setChanges] = useState<ExerciseChanges>(createEmptyChanges());

	const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	// Form dialog state
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [selectedExercise, setSelectedExercise] =
		useState<LocalExercise | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Unsaved changes alert state
	const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

	// Collapsible week groups state
	const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

	const { toast } = useToast();

	// Check if there are unsaved changes
	const hasUnsavedChanges = useMemo(
		() => checkHasUnsavedChanges(changes),
		[changes]
	);

	// Group exercises by week ranges
	const weekGroups = useMemo(
		() => groupLocalExercisesByWeeks(localExercises),
		[localExercises]
	);

	// Get unique categories from available videos
	const categories = useMemo(() => {
		return Array.from(
			new Set(availableVideos.map((video) => video.category))
		).sort();
	}, [availableVideos]);

	// Filter available videos
	const filteredAvailableVideos = useMemo(() => {
		return availableVideos
			.filter((video) => {
				const matchesSearch =
					video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					video.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
					video.code.toLowerCase().includes(searchTerm.toLowerCase());

				const matchesCategory =
					selectedCategory === "all" || video.category === selectedCategory;

				return matchesSearch && matchesCategory;
			})
			.sort((a, b) => a.code.localeCompare(b.code));
	}, [availableVideos, searchTerm, selectedCategory]);

	// Initialize expanded weeks when exercises load
	useEffect(() => {
		if (weekGroups.length > 0) {
			const allWeekKeys = weekGroups.map((g) => `${g.startWeek}-${g.endWeek}`);
			setExpandedWeeks(new Set(allWeekKeys));
		}
	}, [weekGroups]);

	// Reset state when modal opens
	useEffect(() => {
		if (open && program?.id) {
			fetchExercises();
			fetchAllVideos();
			setSearchTerm("");
			setSelectedCategory("all");
			setChanges(createEmptyChanges());
		}
	}, [open, program?.id]);

	const fetchExercises = async () => {
		if (!program?.id) return;

		try {
			setLoading(true);
			const response = await fetch(
				`/api/protected/exercise-programs/programs/${program.id}/exercises`
			);
			if (!response.ok) throw new Error("Failed to fetch exercises");
			const result = await response.json();
			setOriginalExercises(result.data);
			setLocalExercises(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load program exercises",
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
			setAvailableVideos(result.data);
		} catch (error) {
			console.error("Failed to fetch videos:", error);
		}
	};

	/**
	 * Handle adding a new exercise (local state only)
	 */
	const handleAddExercise = useCallback(
		(data: CreateProgramExerciseData) => {
			const video = availableVideos.find((v) => v.id === data.video_id);
			if (!video) return;

			// Calculate next display_order
			const maxOrder = localExercises.reduce((max, ex) => {
				return Math.max(max, ex.display_order || 0);
			}, 0);

			const tempId = generateTempId();
			const newExercise: PendingExercise = {
				tempId,
				program_id: program?.id || 0,
				video_id: data.video_id,
				video,
				start_week: data.start_week,
				end_week: data.end_week,
				display_order: maxOrder + 1,
				volume_type: data.volume_type,
				sets: data.sets ?? null,
				reps: data.reps ?? null,
				hold_seconds: data.hold_seconds ?? null,
				notes: data.notes ?? null,
				notes_ar: data.notes_ar ?? null,
			};

			// Update local exercises
			setLocalExercises((prev) => [...prev, newExercise]);

			// Track the addition
			setChanges((prev) => ({
				...prev,
				added: [...prev.added, newExercise],
			}));

			setShowAddDialog(false);
			setSelectedExercise(null);
		},
		[availableVideos, localExercises, program?.id]
	);

	/**
	 * Handle editing an exercise (local state only)
	 */
	const handleEditExercise = useCallback(
		(data: CreateProgramExerciseData) => {
			if (!selectedExercise) return;

			const identifier = getExerciseIdentifier(selectedExercise);

			// Update local exercises
			setLocalExercises((prev) =>
				prev.map((ex) => {
					const exId = getExerciseIdentifier(ex);
					if (exId === identifier) {
						return {
							...ex,
							start_week: data.start_week,
							end_week: data.end_week,
							volume_type: data.volume_type,
							sets: data.sets ?? null,
							reps: data.reps ?? null,
							hold_seconds: data.hold_seconds ?? null,
							notes: data.notes ?? null,
							notes_ar: data.notes_ar ?? null,
						};
					}
					return ex;
				})
			);

			// Track the change
			if (isPendingExercise(selectedExercise)) {
				// Update the pending exercise in the added array
				setChanges((prev) => ({
					...prev,
					added: prev.added.map((ex) => {
						if (ex.tempId === identifier) {
							return {
								...ex,
								start_week: data.start_week,
								end_week: data.end_week,
								volume_type: data.volume_type,
								sets: data.sets ?? null,
								reps: data.reps ?? null,
								hold_seconds: data.hold_seconds ?? null,
								notes: data.notes ?? null,
								notes_ar: data.notes_ar ?? null,
							};
						}
						return ex;
					}),
				}));
			} else {
				// Track modification for existing exercise
				const exerciseId = identifier as number;
				setChanges((prev) => {
					const newModified = new Map(prev.modified);
					newModified.set(exerciseId, {
						start_week: data.start_week,
						end_week: data.end_week,
						volume_type: data.volume_type,
						sets: data.sets,
						reps: data.reps,
						hold_seconds: data.hold_seconds,
						notes: data.notes,
						notes_ar: data.notes_ar,
					});
					return {
						...prev,
						modified: newModified,
					};
				});
			}

			setShowEditDialog(false);
			setSelectedExercise(null);
		},
		[selectedExercise]
	);

	/**
	 * Handle deleting an exercise (local state only)
	 */
	const handleDeleteExercise = useCallback(async () => {
		if (!selectedExercise) return;

		const identifier = getExerciseIdentifier(selectedExercise);

		// Remove from local exercises
		setLocalExercises((prev) =>
			prev.filter((ex) => getExerciseIdentifier(ex) !== identifier)
		);

		// Track the deletion
		if (isPendingExercise(selectedExercise)) {
			// Remove from added array
			setChanges((prev) => ({
				...prev,
				added: prev.added.filter((ex) => ex.tempId !== identifier),
			}));
		} else {
			// Add to deleted set
			const exerciseId = identifier as number;
			setChanges((prev) => {
				const newDeleted = new Set(prev.deleted);
				newDeleted.add(exerciseId);
				// Also remove from modified if present
				const newModified = new Map(prev.modified);
				newModified.delete(exerciseId);
				return {
					...prev,
					deleted: newDeleted,
					modified: newModified,
				};
			});
		}

		setShowDeleteDialog(false);
		setSelectedExercise(null);
	}, [selectedExercise]);

	/**
	 * Handle moving an exercise up within its week group (local state only)
	 */
	const handleMoveUp = useCallback(
		(group: LocalWeekGroup, exerciseIndex: number) => {
			if (exerciseIndex === 0) return;

			const exercise = group.exercises[exerciseIndex];
			const prevExercise = group.exercises[exerciseIndex - 1];

			// Swap display_order values
			setLocalExercises((prev) => {
				const newExercises = [...prev];
				const exerciseIdx = newExercises.findIndex(
					(e) => getExerciseIdentifier(e) === getExerciseIdentifier(exercise)
				);
				const prevIdx = newExercises.findIndex(
					(e) =>
						getExerciseIdentifier(e) === getExerciseIdentifier(prevExercise)
				);

				if (exerciseIdx === -1 || prevIdx === -1) return prev;

				const tempOrder = newExercises[exerciseIdx].display_order;
				newExercises[exerciseIdx] = {
					...newExercises[exerciseIdx],
					display_order: newExercises[prevIdx].display_order,
				};
				newExercises[prevIdx] = {
					...newExercises[prevIdx],
					display_order: tempOrder,
				};

				return newExercises;
			});

			// Track the reorder for both exercises
			trackReorder(exercise);
			trackReorder(prevExercise);
		},
		[]
	);

	/**
	 * Handle moving an exercise down within its week group (local state only)
	 */
	const handleMoveDown = useCallback(
		(group: LocalWeekGroup, exerciseIndex: number) => {
			if (exerciseIndex === group.exercises.length - 1) return;

			const exercise = group.exercises[exerciseIndex];
			const nextExercise = group.exercises[exerciseIndex + 1];

			// Swap display_order values
			setLocalExercises((prev) => {
				const newExercises = [...prev];
				const exerciseIdx = newExercises.findIndex(
					(e) => getExerciseIdentifier(e) === getExerciseIdentifier(exercise)
				);
				const nextIdx = newExercises.findIndex(
					(e) =>
						getExerciseIdentifier(e) === getExerciseIdentifier(nextExercise)
				);

				if (exerciseIdx === -1 || nextIdx === -1) return prev;

				const tempOrder = newExercises[exerciseIdx].display_order;
				newExercises[exerciseIdx] = {
					...newExercises[exerciseIdx],
					display_order: newExercises[nextIdx].display_order,
				};
				newExercises[nextIdx] = {
					...newExercises[nextIdx],
					display_order: tempOrder,
				};

				return newExercises;
			});

			// Track the reorder for both exercises
			trackReorder(exercise);
			trackReorder(nextExercise);
		},
		[]
	);

	/**
	 * Track a reorder change for an exercise
	 */
	const trackReorder = useCallback((exercise: LocalExercise) => {
		if (isPendingExercise(exercise)) {
			// For pending exercises, update in added array (display_order already updated in local state)
			setChanges((prev) => {
				const currentExercise = prev.added.find(
					(e) => e.tempId === exercise.tempId
				);
				if (!currentExercise) return prev;

				return {
					...prev,
					added: prev.added.map((ex) =>
						ex.tempId === exercise.tempId
							? { ...ex, display_order: exercise.display_order }
							: ex
					),
				};
			});
		} else {
			// For existing exercises, track the display_order change
			const exerciseId = exercise.id;
			setChanges((prev) => {
				const newModified = new Map(prev.modified);
				const existing = newModified.get(exerciseId) || {};
				newModified.set(exerciseId, {
					...existing,
					display_order: exercise.display_order ?? undefined,
				});
				return {
					...prev,
					modified: newModified,
				};
			});
		}
	}, []);

	/**
	 * Save all changes to the database
	 */
	const handleSave = async () => {
		if (!program?.id || !hasUnsavedChanges) return;

		try {
			setSaving(true);

			// Build the bulk sync payload
			const payload: BulkSyncExercisesPayload = {
				create: changes.added.map((ex) => ({
					video_id: ex.video_id,
					start_week: ex.start_week,
					end_week: ex.end_week,
					display_order: ex.display_order ?? undefined,
					volume_type: ex.volume_type,
					sets: ex.sets ?? undefined,
					reps: ex.reps ?? undefined,
					hold_seconds: ex.hold_seconds ?? undefined,
					notes: ex.notes ?? undefined,
					notes_ar: ex.notes_ar ?? undefined,
				})),
				update: Array.from(changes.modified.entries()).map(([id, data]) => ({
					id,
					data,
				})),
				delete: Array.from(changes.deleted),
			};

			const response = await fetch(
				`/api/protected/exercise-programs/programs/${program.id}/exercises/bulk`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save changes");
			}

			toast({
				title: "Success",
				description: "Changes saved successfully",
			});

			// Reset changes and refresh
			setChanges(createEmptyChanges());
			await fetchExercises();
			onExerciseChanged();
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

	/**
	 * Handle cancel/close with unsaved changes check
	 */
	const handleClose = useCallback(() => {
		if (hasUnsavedChanges) {
			setShowUnsavedAlert(true);
		} else {
			onOpenChange(false);
		}
	}, [hasUnsavedChanges, onOpenChange]);

	/**
	 * Discard changes and close
	 */
	const handleDiscard = useCallback(() => {
		setShowUnsavedAlert(false);
		setChanges(createEmptyChanges());
		setLocalExercises(originalExercises);
		onOpenChange(false);
	}, [originalExercises, onOpenChange]);

	const openEditDialog = (exercise: LocalExercise) => {
		setSelectedExercise(exercise);
		setShowEditDialog(true);
	};

	const openDeleteDialog = (exercise: LocalExercise) => {
		setSelectedExercise(exercise);
		setShowDeleteDialog(true);
	};

	const toggleWeekGroup = (key: string) => {
		setExpandedWeeks((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	};

	const renderWeekGroup = (group: LocalWeekGroup) => {
		const key = `${group.startWeek}-${group.endWeek}`;
		const isExpanded = expandedWeeks.has(key);

		return (
			<Collapsible
				key={key}
				open={isExpanded}
				onOpenChange={() => toggleWeekGroup(key)}
				className="border rounded-lg overflow-hidden"
			>
				<CollapsibleTrigger asChild>
					<div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted cursor-pointer">
						<div className="flex items-center gap-2">
							{isExpanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
							<span className="font-medium">{group.label}</span>
							<Badge variant="secondary">
								{group.exercises.length} exercises
							</Badge>
						</div>
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[60px]">Order</TableHead>
								<TableHead className="w-[220px]">Video</TableHead>
								<TableHead className="w-[130px]">Volume</TableHead>
								<TableHead className="w-[120px]">Notes</TableHead>
								<TableHead className="w-[100px] text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{group.exercises.map((exercise, index) => {
								const isFirst = index === 0;
								const isLast = index === group.exercises.length - 1;
								const isPending = isPendingExercise(exercise);
								const exerciseKey = isPending
									? (exercise as PendingExercise).tempId
									: (exercise as ExerciseWithVideo).id;

								return (
									<TableRow
										key={exerciseKey}
										className={isPending ? "bg-green-500/5" : ""}
									>
										<TableCell>
											<div className="flex flex-col gap-0.5">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => handleMoveUp(group, index)}
													disabled={isFirst}
													title="Move up"
												>
													<ArrowUp className="h-3 w-3" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => handleMoveDown(group, index)}
													disabled={isLast}
													title="Move down"
												>
													<ArrowDown className="h-3 w-3" />
												</Button>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium text-sm flex items-center gap-2">
													{exercise.video.title}
													{isPending && (
														<Badge variant="outline" className="text-xs">
															New
														</Badge>
													)}
												</div>
												<div
													className="text-xs text-muted-foreground"
													dir="rtl"
												>
													{exercise.video.title_ar}
												</div>
												<div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
													<Clock className="h-3 w-3" />
													{formatDuration(exercise.video.duration)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											{exercise.volume_type === "reps_with_hold" ? (
												<div className="flex flex-col gap-0.5">
													<Badge variant="outline" className="text-xs w-fit">
														{exercise.sets}x{exercise.reps}
													</Badge>
													<Badge variant="secondary" className="text-xs w-fit">
														{exercise.hold_seconds}s hold
													</Badge>
												</div>
											) : (
												<Badge variant="outline">
													{formatVolume(exercise as any)}
												</Badge>
											)}
										</TableCell>
										<TableCell className="max-w-[120px]">
											{exercise.notes || exercise.notes_ar ? (
												<div
													className="text-xs truncate"
													title={exercise.notes || exercise.notes_ar || ""}
												>
													{exercise.notes || exercise.notes_ar}
												</div>
											) : (
												<span className="text-muted-foreground text-xs">-</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openEditDialog(exercise)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openDeleteDialog(exercise)}
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CollapsibleContent>
			</Collapsible>
		);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="max-w-[95vw] w-full h-[85vh] flex flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							Manage Exercises: {program?.title}
							{hasUnsavedChanges && (
								<Badge variant="secondary" className="text-xs">
									Unsaved changes
								</Badge>
							)}
						</DialogTitle>
						<DialogDescription>
							Add and configure exercises for this program with week ranges and
							volume settings. Changes are saved when you click Save.
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-hidden min-h-0">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
							{/* Left Panel - Available Videos */}
							<div className="flex flex-col h-full overflow-hidden border rounded-lg">
								<div className="p-4 border-b bg-muted/30">
									<div className="flex items-center justify-between mb-3">
										<h3 className="font-medium">
											Available Videos ({filteredAvailableVideos.length})
										</h3>
									</div>
									<div className="flex gap-2">
										<div className="relative flex-1">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												placeholder="Search videos..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="pl-9"
											/>
										</div>
										<Select
											value={selectedCategory}
											onValueChange={setSelectedCategory}
										>
											<SelectTrigger className="w-40">
												<SelectValue placeholder="Category" />
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

								<div className="flex-1 overflow-y-auto p-4 space-y-2">
									{filteredAvailableVideos.length === 0 ? (
										<div className="text-center py-8">
											<VideoIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
											<p className="text-muted-foreground">
												No videos match your search
											</p>
										</div>
									) : (
										filteredAvailableVideos.map((video) => (
											<div
												key={video.id}
												className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
											>
												<div className="flex-1 min-w-0 mr-3">
													<div className="font-medium text-sm truncate">
														{video.title}
													</div>
													<div
														className="text-xs text-muted-foreground truncate"
														dir="rtl"
													>
														{video.title_ar}
													</div>
													<div className="flex items-center gap-2 mt-1">
														<Badge variant="outline" className="text-xs">
															{video.category}
														</Badge>
														<span className="text-xs text-muted-foreground flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{formatDuration(video.duration)}
														</span>
													</div>
												</div>
												<Button
													size="sm"
													onClick={() => {
														setSelectedExercise({
															video_id: video.id,
															video: video,
														} as any);
														setShowAddDialog(true);
													}}
												>
													<Plus className="h-4 w-4 mr-1" />
													Add
												</Button>
											</div>
										))
									)}
								</div>
							</div>

							{/* Right Panel - Program Exercises */}
							<div className="flex flex-col h-full overflow-hidden border rounded-lg">
								<div className="p-4 border-b bg-muted/30">
									<div className="flex items-center justify-between">
										<h3 className="font-medium">
											Program Exercises ({localExercises.length})
										</h3>
										<Button size="sm" onClick={() => setShowAddDialog(true)}>
											<Plus className="h-4 w-4 mr-1" />
											Add Exercise
										</Button>
									</div>
								</div>

								<div className="flex-1 overflow-y-auto p-4 space-y-3">
									{loading ? (
										<div className="flex items-center justify-center py-12">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
										</div>
									) : weekGroups.length === 0 ? (
										<div className="text-center py-12">
											<VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
											<p className="text-muted-foreground text-lg mb-2">
												No exercises in this program
											</p>
											<p className="text-muted-foreground text-sm mb-4">
												Add videos from the left panel to create exercises
											</p>
											<Button onClick={() => setShowAddDialog(true)}>
												<Plus className="h-4 w-4 mr-2" />
												Add First Exercise
											</Button>
										</div>
									) : (
										weekGroups.map(renderWeekGroup)
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Footer with Save/Cancel */}
					<DialogFooter className="border-t pt-4 mt-4">
						<Button variant="outline" onClick={handleClose} disabled={saving}>
							<X className="h-4 w-4 mr-2" />
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={saving || !hasUnsavedChanges}
						>
							{saving ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Saving...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Save Changes
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Exercise Dialog */}
			<ExerciseFormDialog
				open={showAddDialog}
				onOpenChange={(open) => {
					setShowAddDialog(open);
					if (!open) setSelectedExercise(null);
				}}
				onSubmitSync={handleAddExercise}
				availableVideos={availableVideos}
				title="Add Exercise"
				description="Configure the exercise settings for this program"
				defaultValues={
					selectedExercise
						? {
								video_id: selectedExercise.video_id,
								video: selectedExercise.video,
						  }
						: undefined
				}
			/>

			{/* Edit Exercise Dialog */}
			<ExerciseFormDialog
				open={showEditDialog}
				onOpenChange={(open) => {
					setShowEditDialog(open);
					if (!open) setSelectedExercise(null);
				}}
				onSubmitSync={handleEditExercise}
				availableVideos={availableVideos}
				title="Edit Exercise"
				description="Update exercise settings"
				defaultValues={selectedExercise || undefined}
				isEdit={true}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteExercise}
				title="Remove Exercise"
				description={
					selectedExercise
						? `Are you sure you want to remove "${selectedExercise.video?.title}" from this program?`
						: ""
				}
			/>

			{/* Unsaved Changes Alert */}
			<UnsavedChangesAlert
				open={showUnsavedAlert}
				onOpenChange={setShowUnsavedAlert}
				onDiscard={handleDiscard}
				onCancel={() => setShowUnsavedAlert(false)}
			/>
		</>
	);
}
