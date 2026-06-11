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
import type { LocationRow } from "@/types/location-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	location: LocationRow | null;
	onSuccess: () => void;
}

export function DeleteLocationDialog({
	open,
	onOpenChange,
	location,
	onSuccess,
}: Props) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const inUse =
		(location?.therapist_count ?? 0) > 0 || (location?.request_count ?? 0) > 0;

	const handleDelete = async () => {
		if (!location) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/protected/locations/${location.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to delete service area");
			}
			toast({
				title: "Deleted",
				description: `"${location.location_name}" was removed.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to delete service area",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Delete {location?.location_name}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						{inUse
							? `This area is in use — ${location?.therapist_count} therapist(s) cover it and ${location?.request_count} request(s) reference it. Deletion will be blocked; remove those first.`
							: "Patients will no longer be able to book home visits in this area, and therapists won't be able to select it. This cannot be undone."}
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
