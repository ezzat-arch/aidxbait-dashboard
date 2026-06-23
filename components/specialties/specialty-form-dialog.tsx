"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import type { SpecialtyRow } from "@/types/specialty-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** null = create, otherwise edit */
	specialty: SpecialtyRow | null;
	onSuccess: () => void;
}

export function SpecialtyFormDialog({
	open,
	onOpenChange,
	specialty,
	onSuccess,
}: Props) {
	const [name, setName] = useState("");
	const [nameAr, setNameAr] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const isEdit = specialty !== null;

	useEffect(() => {
		if (open) {
			setName(specialty?.name ?? "");
			setNameAr(specialty?.name_ar ?? "");
			setIsActive(specialty?.is_active ?? true);
		}
	}, [open, specialty]);

	const handleSubmit = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast({
				variant: "destructive",
				title: "Validation",
				description: "Specialty name is required",
			});
			return;
		}

		setLoading(true);
		try {
			const url = isEdit
				? `/api/protected/specialties/${specialty.id}`
				: "/api/protected/specialties";
			const res = await fetch(url, {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: trimmed,
					name_ar: nameAr.trim() || null,
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to save specialty");
			}

			toast({
				title: "Saved",
				description: isEdit
					? `"${trimmed}" updated.`
					: `"${trimmed}" added. Therapists can now select it.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to save specialty",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? `Edit ${specialty.name}` : "Add specialty"}
					</DialogTitle>
					<DialogDescription>
						Inactive specialties stay in history but no longer appear for
						therapists or patients to choose.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="spec-name">Name (English)</Label>
						<Input
							id="spec-name"
							placeholder="e.g. Orthopedic Physiotherapy"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="spec-name-ar">Name (Arabic)</Label>
						<Input
							id="spec-name-ar"
							dir="rtl"
							placeholder="مثال: العلاج الطبيعي للعظام"
							value={nameAr}
							onChange={(e) => setNameAr(e.target.value)}
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border p-3">
						<div>
							<Label htmlFor="spec-active">Active</Label>
							<p className="text-xs text-muted-foreground">
								Visible to therapists and patients
							</p>
						</div>
						<Switch
							id="spec-active"
							checked={isActive}
							onCheckedChange={setIsActive}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEdit ? "Save changes" : "Add specialty"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
