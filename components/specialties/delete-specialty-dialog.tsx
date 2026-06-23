"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import type { SpecialtyRow } from "@/types/specialty-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	specialty: SpecialtyRow | null;
	onSuccess: () => void;
}

export function DeleteSpecialtyDialog({
	open,
	onOpenChange,
	specialty,
	onSuccess,
}: Props) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const inUse = (specialty?.therapist_count ?? 0) > 0;

	const handleDelete = async () => {
		if (!specialty) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/protected/specialties/${specialty.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to delete specialty");
			}
			toast({
				title: "Deleted",
				description: `"${specialty.name}" was removed.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to delete specialty",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {specialty?.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						{inUse
							? `This specialty is used by ${specialty?.therapist_count} therapist(s). Deletion will be blocked — set it inactive instead to hide it without losing history.`
							: "This cannot be undone. Consider setting it inactive instead if you might use it again."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleDelete();
						}}
						disabled={loading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
