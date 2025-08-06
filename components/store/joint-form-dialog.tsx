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
import type { JointFormDialogProps } from "@/types/store-types";

export function JointFormDialog({
	open,
	onOpenChange,
	onSubmit,
	title,
	description,
	defaultValues,
}: JointFormDialogProps) {
	const [formData, setFormData] = useState({
		name: "",
		name_ar: "",
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (defaultValues) {
			setFormData(defaultValues);
		} else {
			setFormData({ name: "", name_ar: "" });
		}
	}, [defaultValues, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim() || !formData.name_ar.trim()) return;

		try {
			setLoading(true);
			await onSubmit({
				name: formData.name.trim(),
				name_ar: formData.name_ar.trim(),
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

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Joint Name (English) *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="e.g. Knee, Shoulder, Ankle..."
							required
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name_ar">Joint Name (Arabic) *</Label>
						<Input
							id="name_ar"
							value={formData.name_ar}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name_ar: e.target.value }))
							}
							placeholder="مثل: الركبة، الكتف، الكاحل..."
							required
							disabled={loading}
							dir="rtl"
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
						<Button
							type="submit"
							disabled={
								loading || !formData.name.trim() || !formData.name_ar.trim()
							}
						>
							{loading ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
