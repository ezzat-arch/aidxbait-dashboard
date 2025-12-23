"use client";

import { useState, useEffect } from "react";
import { FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecureHlsPreviewPlayer } from "@/components/video/SecureHlsPreviewPlayer";
import type {
	CreateVideoData,
	UpdateVideoData,
	DurationInput,
	Video,
} from "@/types/exercise-program-types";
import {
	durationInputToSeconds,
	secondsToDurationInput,
} from "@/types/exercise-program-types";

interface VideoFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (
		data: CreateVideoData | Omit<UpdateVideoData, "id">
	) => Promise<void>;
	title: string;
	description: string;
	defaultValues?: Partial<Video>;
	isEdit?: boolean;
}

export function VideoFormDialog({
	open,
	onOpenChange,
	onSubmit,
	title,
	description,
	defaultValues,
	isEdit = false,
}: VideoFormDialogProps) {
	const [formData, setFormData] = useState({
		title: "",
		title_ar: "",
		category: "",
		category_ar: "",
		description: "",
		description_ar: "",
		code: "",
		s3_key: "",
		size_mb: 0,
	});

	const [durationInput, setDurationInput] = useState<DurationInput>({
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (defaultValues) {
			setFormData({
				title: defaultValues.title || "",
				title_ar: defaultValues.title_ar || "",
				category: defaultValues.category || "",
				category_ar: defaultValues.category_ar || "",
				description: defaultValues.description || "",
				description_ar: defaultValues.description_ar || "",
				code: defaultValues.code || "",
				s3_key: defaultValues.s3_key || "",
				size_mb: defaultValues.size_mb || 0,
			});

			if (defaultValues.duration !== undefined) {
				setDurationInput(secondsToDurationInput(defaultValues.duration));
			} else {
				setDurationInput({ hours: 0, minutes: 0, seconds: 0 });
			}
		} else {
			setFormData({
				title: "",
				title_ar: "",
				category: "",
				category_ar: "",
				description: "",
				description_ar: "",
				code: "",
				s3_key: "",
				size_mb: 0,
			});
			setDurationInput({ hours: 0, minutes: 0, seconds: 0 });
		}
	}, [defaultValues, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!formData.title.trim() || !formData.title_ar.trim()) {
			return;
		}
		if (
			!isEdit &&
			(!formData.category.trim() || !formData.category_ar.trim())
		) {
			return;
		}
		if (!isEdit && !formData.code.trim()) {
			return;
		}
		if (!isEdit && !formData.s3_key.trim()) {
			return;
		}

		const duration = durationInputToSeconds(durationInput);

		try {
			setLoading(true);

			if (isEdit) {
				// For editing, only send editable fields
				await onSubmit({
					title: formData.title.trim(),
					title_ar: formData.title_ar.trim(),
					description: formData.description.trim() || undefined,
					description_ar: formData.description_ar.trim() || undefined,
					duration,
				});
			} else {
				// For creating, send all required fields
				await onSubmit({
					title: formData.title.trim(),
					title_ar: formData.title_ar.trim(),
					category: formData.category.trim(),
					category_ar: formData.category_ar.trim(),
					description: formData.description.trim() || undefined,
					description_ar: formData.description_ar.trim() || undefined,
					code: formData.code.trim(),
					s3_key: formData.s3_key.trim(),
					duration,
					size_mb: formData.size_mb,
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading) {
			onOpenChange(false);
		}
	};

	const isFormValid = () => {
		if (!formData.title.trim() || !formData.title_ar.trim()) return false;
		if (!isEdit && (!formData.category.trim() || !formData.category_ar.trim()))
			return false;
		if (!isEdit && !formData.code.trim()) return false;
		if (!isEdit && !formData.s3_key.trim()) return false;
		return true;
	};

	// Get the video code for preview (use defaultValues.code when editing)
	const videoCodeForPreview = isEdit && defaultValues?.code ? defaultValues.code : null;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className={isEdit ? "sm:max-w-[1000px] max-h-[90vh] overflow-y-auto" : "sm:max-w-[600px] max-h-[90vh] overflow-y-auto"}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className={isEdit ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
					{/* Form Section */}
					<form onSubmit={handleSubmit} className="space-y-6">
						<Tabs defaultValue="english" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="english">English</TabsTrigger>
								<TabsTrigger value="arabic">العربية</TabsTrigger>
							</TabsList>

							<TabsContent value="english" className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="title">Title (English) *</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, title: e.target.value }))
										}
										placeholder="Enter video title in English"
										required
										disabled={loading}
									/>
								</div>

								{!isEdit && (
									<div className="space-y-2">
										<Label htmlFor="category">Category (English) *</Label>
										<Input
											id="category"
											value={formData.category}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													category: e.target.value,
												}))
											}
											placeholder="Enter category in English"
											required
											disabled={loading}
										/>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="description">Description (English)</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
										placeholder="Enter video description in English (optional)"
										disabled={loading}
										rows={3}
									/>
								</div>
							</TabsContent>

							<TabsContent value="arabic" className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="title_ar">Title (Arabic) *</Label>
									<Input
										id="title_ar"
										value={formData.title_ar}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												title_ar: e.target.value,
											}))
										}
										placeholder="أدخل عنوان الفيديو بالعربية"
										required
										disabled={loading}
										dir="rtl"
									/>
								</div>

								{!isEdit && (
									<div className="space-y-2">
										<Label htmlFor="category_ar">Category (Arabic) *</Label>
										<Input
											id="category_ar"
											value={formData.category_ar}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													category_ar: e.target.value,
												}))
											}
											placeholder="أدخل الفئة بالعربية"
											required
											disabled={loading}
											dir="rtl"
										/>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="description_ar">Description (Arabic)</Label>
									<Textarea
										id="description_ar"
										value={formData.description_ar}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description_ar: e.target.value,
											}))
										}
										placeholder="أدخل وصف الفيديو بالعربية (اختياري)"
										disabled={loading}
										rows={3}
										dir="rtl"
									/>
								</div>
							</TabsContent>
						</Tabs>

						{/* Duration Input */}
						<div className="space-y-2">
							<Label>Duration *</Label>
							<div className="flex items-center space-x-2">
								<div className="flex items-center space-x-1">
									<Input
										type="number"
										min="0"
										max="23"
										value={durationInput.hours}
										onChange={(e) =>
											setDurationInput((prev) => ({
												...prev,
												hours: Math.max(0, parseInt(e.target.value) || 0),
											}))
										}
										className="w-20"
										disabled={loading}
									/>
									<Label className="text-sm text-muted-foreground">hours</Label>
								</div>
								<div className="flex items-center space-x-1">
									<Input
										type="number"
										min="0"
										max="59"
										value={durationInput.minutes}
										onChange={(e) =>
											setDurationInput((prev) => ({
												...prev,
												minutes: Math.max(
													0,
													Math.min(59, parseInt(e.target.value) || 0)
												),
											}))
										}
										className="w-20"
										disabled={loading}
									/>
									<Label className="text-sm text-muted-foreground">min</Label>
								</div>
								<div className="flex items-center space-x-1">
									<Input
										type="number"
										min="0"
										max="59"
										value={durationInput.seconds}
										onChange={(e) =>
											setDurationInput((prev) => ({
												...prev,
												seconds: Math.max(
													0,
													Math.min(59, parseInt(e.target.value) || 0)
												),
											}))
										}
										className="w-20"
										disabled={loading}
									/>
									<Label className="text-sm text-muted-foreground">sec</Label>
								</div>
							</div>
							<p className="text-sm text-muted-foreground">
								Total: {durationInputToSeconds(durationInput)} seconds
							</p>
						</div>

						{/* Non-editable fields for create mode */}
						{!isEdit && (
							<>
								<div className="space-y-2">
									<Label htmlFor="code">Video Code *</Label>
									<Input
										id="code"
										value={formData.code}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, code: e.target.value }))
										}
										placeholder="Enter unique video code (e.g., 1209, EX001)"
										required
										disabled={loading}
									/>
									<p className="text-sm text-muted-foreground">
										A unique identifier for this video. This will be displayed in
										the videos table.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="s3_key">S3 Key *</Label>
									<Input
										id="s3_key"
										value={formData.s3_key}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, s3_key: e.target.value }))
										}
										placeholder="videos/example-video.mp4"
										required
										disabled={loading}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="size_mb">File Size (MB) *</Label>
									<Input
										id="size_mb"
										type="number"
										min="0"
										step="0.01"
										value={formData.size_mb}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												size_mb: parseFloat(e.target.value) || 0,
											}))
										}
										placeholder="0.00"
										required
										disabled={loading}
									/>
								</div>
							</>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || !isFormValid()}>
								{loading ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</form>

					{/* Video Preview Section - Only shown when editing */}
					{isEdit && videoCodeForPreview && (
						<div className="space-y-4 lg:border-l lg:pl-6">
							<div className="flex items-center gap-2">
								<FileVideo className="h-5 w-5 text-primary" />
								<h3 className="text-lg font-semibold">Video Preview</h3>
							</div>
							<SecureHlsPreviewPlayer
								videoCode={videoCodeForPreview}
								isOpen={open}
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
