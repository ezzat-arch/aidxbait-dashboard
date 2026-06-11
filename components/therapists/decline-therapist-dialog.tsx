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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { TherapistRow } from "@/types/therapist-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	therapist: TherapistRow | null;
	onSuccess: () => void;
}

export function DeclineTherapistDialog({
	open,
	onOpenChange,
	therapist,
	onSuccess,
}: Props) {
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		if (open) setReason("");
	}, [open]);

	const name =
		[therapist?.first_name, therapist?.last_name].filter(Boolean).join(" ") ||
		"this therapist";

	const handleDecline = async () => {
		if (!therapist) return;
		if (!reason.trim()) {
			toast({
				variant: "destructive",
				title: "Reason required",
				description: "Please tell the therapist why their application was declined.",
			});
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(
				`/api/protected/therapists/${therapist.id}/decline`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ reason: reason.trim() }),
				}
			);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to decline therapist");
			}
			toast({
				title: "Application declined",
				description: `${name} was notified with your reason.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to decline therapist",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Decline {name}</DialogTitle>
					<DialogDescription>
						The reason is shown to the therapist in the app so they can fix and
						re-apply.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="decline-reason">Reason</Label>
					<Textarea
						id="decline-reason"
						placeholder="e.g. The practice license photo is unreadable. Please re-upload a clear copy."
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={4}
					/>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDecline}
						disabled={loading}
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Decline
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
