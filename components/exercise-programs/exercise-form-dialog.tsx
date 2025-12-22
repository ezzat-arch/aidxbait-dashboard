"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NumericInput } from "@/components/ui/numeric-input";
import type {
	Video,
	VolumeType,
	CreateProgramExerciseData,
	ExerciseWithVideo,
	LocalExercise,
} from "@/types/exercise-program-types";

interface ExerciseFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Synchronous handler for local state management (batch save mode) */
	onSubmitSync?: (data: CreateProgramExerciseData) => void;
	/** Async handler for direct API calls (legacy mode) */
	onSubmit?: (data: CreateProgramExerciseData) => Promise<void>;
	availableVideos: Video[];
	title: string;
	description: string;
	defaultValues?: Partial<ExerciseWithVideo | LocalExercise>;
	isEdit?: boolean;
}

interface FormData {
	video_id: number;
	start_week: number | string;
	end_week: number | string;
	volume_type: VolumeType;
	sets: number | string;
	reps: number | string;
	hold_seconds: number | string;
	notes: string;
	notes_ar: string;
}

export function ExerciseFormDialog({
	open,
	onOpenChange,
	onSubmit,
	onSubmitSync,
	availableVideos,
	title,
	description,
	defaultValues,
	isEdit = false,
}: ExerciseFormDialogProps) {
	const [formData, setFormData] = useState<FormData>({
		video_id: 0,
		start_week: 1,
		end_week: 1,
		volume_type: "reps",
		sets: 3,
		reps: 10,
		hold_seconds: 2,
		notes: "",
		notes_ar: "",
	});

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (defaultValues) {
			// Detect volume type: use explicit value or infer from fields
			let volumeType: VolumeType = defaultValues.volume_type || "reps";
			if (!defaultValues.volume_type) {
				// Fallback inference for legacy data
				if (
					defaultValues.sets !== null &&
					defaultValues.reps !== null &&
					defaultValues.hold_seconds !== null
				) {
					volumeType = "reps_with_hold";
				} else if (defaultValues.sets !== null && defaultValues.reps !== null) {
					volumeType = "reps";
				} else {
					volumeType = "hold";
				}
			}

			setFormData({
				video_id: defaultValues.video_id || 0,
				start_week: defaultValues.start_week || 1,
				end_week: defaultValues.end_week || 1,
				volume_type: volumeType,
				sets: defaultValues.sets ?? 3,
				reps: defaultValues.reps ?? 10,
				hold_seconds: defaultValues.hold_seconds ?? 2,
				notes: defaultValues.notes || "",
				notes_ar: defaultValues.notes_ar || "",
			});
		} else {
			setFormData({
				video_id: 0,
				start_week: 1,
				end_week: 1,
				volume_type: "reps",
				sets: 3,
				reps: 10,
				hold_seconds: 2,
				notes: "",
				notes_ar: "",
			});
		}
		setErrors({});
	}, [defaultValues, open]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!isEdit && !formData.video_id) {
			newErrors.video_id = "Please select a video";
		}

		if (formData.start_week === "" || Number(formData.start_week) < 1) {
			newErrors.start_week = "Start week must be at least 1";
		}

		if (formData.end_week === "" || Number(formData.end_week) < 1) {
			newErrors.end_week = "End week must be at least 1";
		}

		if (
			formData.start_week !== "" &&
			formData.end_week !== "" &&
			Number(formData.start_week) > Number(formData.end_week)
		) {
			newErrors.end_week =
				"End week must be greater than or equal to start week";
		}

		// Validate volume fields based on volume_type
		switch (formData.volume_type) {
			case "reps":
				if (formData.sets === "" || Number(formData.sets) < 1) {
					newErrors.sets = "Sets must be at least 1";
				}
				if (formData.reps === "" || Number(formData.reps) < 1) {
					newErrors.reps = "Reps must be at least 1";
				}
				break;
			case "hold":
				if (formData.sets === "" || Number(formData.sets) < 1) {
					newErrors.sets = "Sets must be at least 1";
				}
				if (formData.hold_seconds === "" || Number(formData.hold_seconds) < 1) {
					newErrors.hold_seconds = "Hold duration must be at least 1 second";
				}
				break;
			case "reps_with_hold":
				if (formData.sets === "" || Number(formData.sets) < 1) {
					newErrors.sets = "Sets must be at least 1";
				}
				if (formData.reps === "" || Number(formData.reps) < 1) {
					newErrors.reps = "Reps must be at least 1";
				}
				if (formData.hold_seconds === "" || Number(formData.hold_seconds) < 1) {
					newErrors.hold_seconds = "Hold duration must be at least 1 second";
				}
				break;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const submitData: CreateProgramExerciseData = {
			video_id: formData.video_id,
			start_week: Number(formData.start_week),
			end_week: Number(formData.end_week),
			volume_type: formData.volume_type,
			notes: formData.notes.trim() || undefined,
			notes_ar: formData.notes_ar.trim() || undefined,
		};

		// Set volume fields based on volume_type
		switch (formData.volume_type) {
			case "reps":
				submitData.sets = Number(formData.sets);
				submitData.reps = Number(formData.reps);
				break;
			case "hold":
				submitData.sets = Number(formData.sets);
				submitData.hold_seconds = Number(formData.hold_seconds);
				break;
			case "reps_with_hold":
				submitData.sets = Number(formData.sets);
				submitData.reps = Number(formData.reps);
				submitData.hold_seconds = Number(formData.hold_seconds);
				break;
		}

		// Use sync handler if provided (batch save mode), otherwise use async handler
		if (onSubmitSync) {
			onSubmitSync(submitData);
			onOpenChange(false);
		} else if (onSubmit) {
			try {
				setLoading(true);
				await onSubmit(submitData);
			} finally {
				setLoading(false);
			}
		}
	};

	const handleClose = () => {
		if (!loading) {
			onOpenChange(false);
		}
	};

	const selectedVideo = availableVideos.find((v) => v.id === formData.video_id);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Video Selector - only show when creating */}
					{!isEdit && (
						<div className="space-y-2">
							<Label htmlFor="video">Video *</Label>
							<Select
								value={
									formData.video_id > 0 ? formData.video_id.toString() : ""
								}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										video_id: parseInt(value) || 0,
									}))
								}
								disabled={loading}
							>
								<SelectTrigger
									className={errors.video_id ? "border-destructive" : ""}
								>
									<SelectValue placeholder="Select a video" />
								</SelectTrigger>
								<SelectContent className="max-h-60">
									{availableVideos.map((video) => (
										<SelectItem key={video.id} value={video.id.toString()}>
											<div className="flex flex-col">
												<span>{video.title}</span>
												<span
													className="text-xs text-muted-foreground"
													dir="rtl"
												>
													{video.title_ar}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.video_id && (
								<p className="text-sm text-destructive">{errors.video_id}</p>
							)}
							{selectedVideo && (
								<p className="text-sm text-muted-foreground">
									Category: {selectedVideo.category}
								</p>
							)}
						</div>
					)}

					{/* Week Range */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start_week">Start Week *</Label>
							<NumericInput
								id="start_week"
								value={formData.start_week}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										start_week: value,
									}))
								}
								className={errors.start_week ? "border-destructive" : ""}
								disabled={loading}
							/>
							{errors.start_week && (
								<p className="text-sm text-destructive">{errors.start_week}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="end_week">End Week *</Label>
							<NumericInput
								id="end_week"
								value={formData.end_week}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										end_week: value,
									}))
								}
								className={errors.end_week ? "border-destructive" : ""}
								disabled={loading}
							/>
							{errors.end_week && (
								<p className="text-sm text-destructive">{errors.end_week}</p>
							)}
						</div>
					</div>

					{/* Volume Type Toggle */}
					<div className="space-y-3">
						<Label>Volume Type *</Label>
						<RadioGroup
							value={formData.volume_type}
							onValueChange={(value: VolumeType) =>
								setFormData((prev) => ({
									...prev,
									volume_type: value,
								}))
							}
							className="flex flex-wrap gap-4"
							disabled={loading}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="reps" id="reps" />
								<Label htmlFor="reps" className="cursor-pointer font-normal">
									Reps
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="hold" id="hold" />
								<Label htmlFor="hold" className="cursor-pointer font-normal">
									Hold
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="reps_with_hold" id="reps_with_hold" />
								<Label
									htmlFor="reps_with_hold"
									className="cursor-pointer font-normal"
								>
									Reps with Hold
								</Label>
							</div>
						</RadioGroup>
						<p className="text-xs text-muted-foreground">
							{formData.volume_type === "reps" &&
								"Sets × Reps (e.g., 3 sets of 10 reps)"}
							{formData.volume_type === "hold" &&
								"Sets × Hold Duration (e.g., 3 sets of 30 second holds)"}
							{formData.volume_type === "reps_with_hold" &&
								"Sets × Reps with a hold on each rep (e.g., 3 sets of 10 reps, 2s hold each)"}
						</p>
					</div>

					{/* Volume Fields - Conditional based on volume_type */}
					{formData.volume_type === "reps" && (
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="sets">Sets *</Label>
								<NumericInput
									id="sets"
									value={formData.sets}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											sets: value,
										}))
									}
									className={errors.sets ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.sets && (
									<p className="text-sm text-destructive">{errors.sets}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="reps">Reps *</Label>
								<NumericInput
									id="reps"
									value={formData.reps}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											reps: value,
										}))
									}
									className={errors.reps ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.reps && (
									<p className="text-sm text-destructive">{errors.reps}</p>
								)}
							</div>
						</div>
					)}

					{formData.volume_type === "hold" && (
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="sets">Sets *</Label>
								<NumericInput
									id="sets"
									value={formData.sets}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											sets: value,
										}))
									}
									className={errors.sets ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.sets && (
									<p className="text-sm text-destructive">{errors.sets}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="hold_seconds">Hold (seconds) *</Label>
								<NumericInput
									id="hold_seconds"
									value={formData.hold_seconds}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											hold_seconds: value,
										}))
									}
									className={errors.hold_seconds ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.hold_seconds && (
									<p className="text-sm text-destructive">
										{errors.hold_seconds}
									</p>
								)}
							</div>
						</div>
					)}

					{formData.volume_type === "reps_with_hold" && (
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="sets">Sets *</Label>
								<NumericInput
									id="sets"
									value={formData.sets}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											sets: value,
										}))
									}
									className={errors.sets ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.sets && (
									<p className="text-sm text-destructive">{errors.sets}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="reps">Reps *</Label>
								<NumericInput
									id="reps"
									value={formData.reps}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											reps: value,
										}))
									}
									className={errors.reps ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.reps && (
									<p className="text-sm text-destructive">{errors.reps}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="hold_seconds">Hold (s) *</Label>
								<NumericInput
									id="hold_seconds"
									value={formData.hold_seconds}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											hold_seconds: value,
										}))
									}
									className={errors.hold_seconds ? "border-destructive" : ""}
									disabled={loading}
								/>
								{errors.hold_seconds && (
									<p className="text-sm text-destructive">
										{errors.hold_seconds}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Bilingual Notes */}
					<Tabs defaultValue="english" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="english">Notes (English)</TabsTrigger>
							<TabsTrigger value="arabic">ملاحظات (العربية)</TabsTrigger>
						</TabsList>

						<TabsContent value="english" className="space-y-2">
							<Textarea
								value={formData.notes}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										notes: e.target.value,
									}))
								}
								placeholder="Add notes for this exercise (optional)"
								disabled={loading}
								rows={3}
							/>
						</TabsContent>

						<TabsContent value="arabic" className="space-y-2">
							<Textarea
								value={formData.notes_ar}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										notes_ar: e.target.value,
									}))
								}
								placeholder="أضف ملاحظات لهذا التمرين (اختياري)"
								disabled={loading}
								rows={3}
								dir="rtl"
							/>
						</TabsContent>
					</Tabs>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading
								? "Saving..."
								: isEdit
								? "Update Exercise"
								: "Add Exercise"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
