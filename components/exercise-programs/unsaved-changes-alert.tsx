"use client";

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

interface UnsavedChangesAlertProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDiscard: () => void;
	onCancel: () => void;
	title?: string;
	description?: string;
}

export function UnsavedChangesAlert({
	open,
	onOpenChange,
	onDiscard,
	onCancel,
	title = "Unsaved Changes",
	description = "You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.",
}: UnsavedChangesAlertProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>
						Keep Editing
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onDiscard}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Discard Changes
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

