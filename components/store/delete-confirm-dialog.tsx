"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { DeleteConfirmDialogProps } from "@/types/store-types";

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
}: DeleteConfirmDialogProps) {
	const [loading, setLoading] = useState(false);

	const handleConfirm = async () => {
		try {
			setLoading(true);
			await onConfirm();
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
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
							<AlertTriangle className="w-5 h-5 text-destructive" />
						</div>
						<div>
							<DialogTitle>{title}</DialogTitle>
							<DialogDescription className="mt-1">
								{description}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

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
						type="button"
						variant="destructive"
						onClick={handleConfirm}
						disabled={loading}
					>
						{loading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
