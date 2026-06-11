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
import type { TherapistRow } from "@/types/therapist-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	therapist: TherapistRow | null;
	onSuccess: () => void;
}

export function ApproveTherapistDialog({
	open,
	onOpenChange,
	therapist,
	onSuccess,
}: Props) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const name =
		[therapist?.first_name, therapist?.last_name].filter(Boolean).join(" ") ||
		"this therapist";

	const handleApprove = async () => {
		if (!therapist) return;
		setLoading(true);
		try {
			const res = await fetch(
				`/api/protected/therapists/${therapist.id}/approve`,
				{ method: "PUT" }
			);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to approve therapist");
			}
			toast({
				title: "Approved",
				description: `${name} can now receive patient requests.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to approve therapist",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Approve {name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This activates the account. The therapist will be able to see and
						accept patient requests in their covered areas.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleApprove();
						}}
						disabled={loading}
						className="bg-green-600 hover:bg-green-700"
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Approve
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
