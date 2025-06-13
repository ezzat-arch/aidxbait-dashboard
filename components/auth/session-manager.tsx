"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/providers/user-provider";
import { setupSessionExpiryHandler } from "@/lib/auth/session-expiry";

export function SessionManager() {
	const [showSessionExpiredDialog, setShowSessionExpiredDialog] =
		useState(false);
	const { user, refreshUser } = useUserContext();
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		// Only set up the handler if the user is logged in
		if (user) {
			const cleanup = setupSessionExpiryHandler(() => {
				setShowSessionExpiredDialog(true);
			});

			return cleanup;
		}
	}, [user]);

	const handleLogout = () => {
		setShowSessionExpiredDialog(false);
		router.push("/login");
		toast({
			title: "Session Expired",
			description: "Your session has expired. Please log in again.",
		});
	};

	const handleRefresh = async () => {
		try {
			await refreshUser();
			setShowSessionExpiredDialog(false);
			toast({
				title: "Session Refreshed",
				description: "Your session has been successfully refreshed.",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to refresh session. Please log in again.",
			});
			handleLogout();
		}
	};

	return (
		<Dialog
			open={showSessionExpiredDialog}
			onOpenChange={setShowSessionExpiredDialog}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Session Expired</DialogTitle>
					<DialogDescription>
						Your session has expired or is about to expire. Would you like to
						refresh your session or log out?
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={handleLogout}>
						Log Out
					</Button>
					<Button onClick={handleRefresh}>Refresh Session</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
