"use client";

// Feature flag: Set to true to make thumbnail required again
const THUMBNAIL_REQUIRED = false;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
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
import { ImageUpload } from "@/components/ui/image-upload";
import type {
	CreateProgramData,
	UpdateProgramData,
	Program,
	ProgramJointName,
} from "@/types/exercise-program-types";

interface ProgramFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (
		data: CreateProgramData | Omit<UpdateProgramData, "id">
	) => Promise<void>;
	title: string;
	description: string;
	defaultValues?: Partial<Program>;
	isEdit?: boolean;
}

export function ProgramFormDialog({
	open,
	onOpenChange,
	onSubmit,
	title,
	description,
	defaultValues,
	isEdit = false,
}: ProgramFormDialogProps) {
	const [formData, setFormData] = useState({
		title: "",
		title_ar: "",
		description: "",
		description_ar: "",
		joint_id: 0,
		thumbnail_url: "",
		price: 0,
	});

	const [joints, setJoints] = useState<ProgramJointName[]>([]);
	const [loading, setLoading] = useState(false);
	const [jointsLoading, setJointsLoading] = useState(false);
	const { toast } = useToast();

	// Fetch joints when component mounts
	useEffect(() => {
		if (open) {
			fetchJoints();
		}
	}, [open]);

	const fetchJoints = async () => {
		try {
			setJointsLoading(true);
			const response = await fetch("/api/protected/exercise-programs/joints");
			if (!response.ok) throw new Error("Failed to fetch program joints");
			const result = await response.json();
			setJoints(result.data);
		} catch (error) {
			console.error("Failed to fetch program joints:", error);
		} finally {
			setJointsLoading(false);
		}
	};

	useEffect(() => {
		if (defaultValues) {
			setFormData({
				title: defaultValues.title || "",
				title_ar: defaultValues.title_ar || "",
				description: defaultValues.description || "",
				description_ar: defaultValues.description_ar || "",
				joint_id: defaultValues.joint_id || 0,
				thumbnail_url: defaultValues.thumbnail_url || "",
				price: defaultValues.price || 0,
			});
		} else {
			setFormData({
				title: "",
				title_ar: "",
				description: "",
				description_ar: "",
				joint_id: 0,
				thumbnail_url: "",
				price: 0,
			});
		}
	}, [defaultValues, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!formData.title.trim() || !formData.title_ar.trim()) {
			return;
		}

		if (THUMBNAIL_REQUIRED && !formData.thumbnail_url.trim()) {
			return;
		}

		if (formData.price < 0) {
			return;
		}

		if (!formData.joint_id) {
			return;
		}

		try {
			setLoading(true);

			await onSubmit({
				title: formData.title.trim(),
				title_ar: formData.title_ar.trim(),
				description: formData.description.trim() || undefined,
				description_ar: formData.description_ar.trim() || undefined,
				joint_id: formData.joint_id,
				thumbnail_url: formData.thumbnail_url.trim() || undefined,
				price: formData.price,
			});
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
		const thumbnailValid = THUMBNAIL_REQUIRED
			? formData.thumbnail_url.trim()
			: true;
		return (
			formData.title.trim() &&
			formData.title_ar.trim() &&
			thumbnailValid &&
			formData.price >= 0 &&
			formData.joint_id > 0
		);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

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
									placeholder="Enter program title in English"
									required
									disabled={loading}
								/>
							</div>

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
									placeholder="Enter program description in English (optional)"
									disabled={loading}
									rows={4}
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
									placeholder="أدخل عنوان البرنامج بالعربية"
									required
									disabled={loading}
									dir="rtl"
								/>
							</div>

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
									placeholder="أدخل وصف البرنامج بالعربية (اختياري)"
									disabled={loading}
									rows={4}
									dir="rtl"
								/>
							</div>
						</TabsContent>
					</Tabs>

					{/* Joint Selection */}
					<div className="space-y-2">
						<Label htmlFor="joint">Joint *</Label>
						<Select
							value={formData.joint_id > 0 ? formData.joint_id.toString() : ""}
							onValueChange={(value) =>
								setFormData((prev) => ({
									...prev,
									joint_id: parseInt(value) || 0,
								}))
							}
							disabled={loading || jointsLoading}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a joint" />
							</SelectTrigger>
							<SelectContent>
								{joints.map((joint) => (
									<SelectItem key={joint.id} value={joint.id.toString()}>
										{joint.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{jointsLoading && (
							<p className="text-sm text-muted-foreground">Loading joints...</p>
						)}
					</div>

					{/* Thumbnail Upload */}
					<ImageUpload
						value={formData.thumbnail_url}
						onChange={(url) =>
							setFormData((prev) => ({ ...prev, thumbnail_url: url }))
						}
						onError={(error) => {
							toast({
								variant: "destructive",
								title: "Thumbnail Upload Failed",
								description: error.message,
							});
						}}
						uploadEndpoint="/api/protected/exercise-programs/upload-thumbnail"
						label="Program Thumbnail"
						description="Upload an image for the exercise program. Recommended aspect ratio: 16:9"
						disabled={loading}
						required={THUMBNAIL_REQUIRED}
					/>

					{/* Price Input */}
					<div className="space-y-2">
						<Label htmlFor="price">Price (EGP) *</Label>
						<PriceInput
							id="price"
							value={formData.price}
							onChange={(value) =>
								setFormData((prev) => ({
									...prev,
									price: value,
								}))
							}
							placeholder="Enter price"
							required
							disabled={loading}
						/>
					</div>

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
			</DialogContent>
		</Dialog>
	);
}
