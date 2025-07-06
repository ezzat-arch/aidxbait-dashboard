"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgramSubscriptionWithDetails } from "@/types/subscription-types";

const cancelSubscriptionSchema = z.object({
	cancellation_reason: z
		.string()
		.min(10, "Cancellation reason must be at least 10 characters"),
});

type CancelSubscriptionFormData = z.infer<typeof cancelSubscriptionSchema>;

interface CancelSubscriptionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscription: ProgramSubscriptionWithDetails | null;
	onSuccess?: () => void;
}

export function CancelSubscriptionDialog({
	open,
	onOpenChange,
	subscription,
	onSuccess,
}: CancelSubscriptionDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CancelSubscriptionFormData>({
		resolver: zodResolver(cancelSubscriptionSchema),
		defaultValues: {
			cancellation_reason: "",
		},
	});

	const onSubmit = async (data: CancelSubscriptionFormData) => {
		if (!subscription) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/protected/exercise-programs/subscriptions/${subscription.id}`,
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						cancellation_reason: data.cancellation_reason.trim(),
					}),
				}
			);

			if (response.ok) {
				toast({
					title: "Success",
					description: "Subscription cancelled successfully",
				});
				onSuccess?.();
				handleClose();
			} else {
				const error = await response.json();
				toast({
					title: "Error",
					description: error.error || "Failed to cancel subscription",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error cancelling subscription:", error);
			toast({
				title: "Error",
				description: "Failed to cancel subscription",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		reset();
		onOpenChange(false);
	};

	if (!subscription) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<AlertTriangle className="h-5 w-5 text-yellow-500" />
						<span>Cancel Subscription</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Alert>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							You are about to cancel the subscription for{" "}
							<strong>{subscription.patient.name}</strong> to{" "}
							<strong>{subscription.program.name}</strong>. This action cannot
							be undone.
						</AlertDescription>
					</Alert>

					<div className="bg-muted/50 p-4 rounded-lg space-y-2">
						<div className="flex justify-between">
							<span className="text-sm font-medium">Patient:</span>
							<span className="text-sm">{subscription.patient.name}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm font-medium">Program:</span>
							<span className="text-sm">{subscription.program.name}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm font-medium">Payment Amount:</span>
							<span className="text-sm">
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: subscription.payment.currency,
								}).format(subscription.payment.amount)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm font-medium">Payment Status:</span>
							<span className="text-sm capitalize">
								{subscription.payment.status}
							</span>
						</div>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="cancellation_reason">
								Cancellation Reason <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="cancellation_reason"
								placeholder="Please provide a detailed reason for cancelling this subscription..."
								className="min-h-[100px]"
								{...register("cancellation_reason")}
							/>
							{errors.cancellation_reason && (
								<p className="text-sm text-red-600">
									{errors.cancellation_reason.message}
								</p>
							)}
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleClose}>
								Keep Active
							</Button>
							<Button type="submit" variant="destructive" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Cancel Subscription
							</Button>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
