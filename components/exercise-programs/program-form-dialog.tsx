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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
	CreateProgramData,
	UpdateProgramData,
	Program,
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
		price: 0,
	});

	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (defaultValues) {
			setFormData({
				title: defaultValues.title || "",
				title_ar: defaultValues.title_ar || "",
				description: defaultValues.description || "",
				description_ar: defaultValues.description_ar || "",
				price: defaultValues.price || 0,
			});
		} else {
			setFormData({
				title: "",
				title_ar: "",
				description: "",
				description_ar: "",
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

		if (formData.price < 0) {
			return;
		}

		try {
			setLoading(true);

			await onSubmit({
				title: formData.title.trim(),
				title_ar: formData.title_ar.trim(),
				description: formData.description.trim() || undefined,
				description_ar: formData.description_ar.trim() || undefined,
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
		return (
			formData.title.trim() && formData.title_ar.trim() && formData.price >= 0
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

					{/* Price Input */}
					<div className="space-y-2">
						<Label htmlFor="price">Price (EGP) *</Label>
						<Input
							id="price"
							type="number"
							min="0"
							step="0.01"
							value={formData.price}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									price: parseFloat(e.target.value) || 0,
								}))
							}
							placeholder="0.00"
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
