"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import type { UserData } from "@/types/user-types";

interface DeleteUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserData | null;
	onSuccess: () => void;
}

export function DeleteUserDialog({
	open,
	onOpenChange,
	user,
	onSuccess,
}: DeleteUserDialogProps) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleDelete = async () => {
		if (!user) return;

		try {
			setLoading(true);

			const response = await fetch(`/api/protected/users/${user.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete user");
			}

			toast({
				title: "Success",
				description: "User deleted successfully",
			});

			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete user",
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

	const userName = user
		? [user.first_name, user.last_name].filter(Boolean).join(" ") || "this user"
		: "this user";

	return (
		<AlertDialog open={open} onOpenChange={handleClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
							<AlertTriangle className="w-5 h-5 text-destructive" />
						</div>
						<div>
							<AlertDialogTitle>Delete User</AlertDialogTitle>
							<AlertDialogDescription className="mt-1">
								Are you sure you want to delete {userName}? This will remove
								them from the authentication system and mark their record as
								deleted. This action cannot be undone.
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>

				<AlertDialogFooter>
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
						onClick={handleDelete}
						disabled={loading}
					>
						{loading ? "Deleting..." : "Delete User"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

