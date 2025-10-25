"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { OrderWithDetails, OrderStatus } from "@/types/order-types";
import { Loader2, AlertTriangle } from "lucide-react";

interface CancelOrderDialogProps {
	order: OrderWithDetails;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function CancelOrderDialog({
	order,
	open,
	onOpenChange,
	onSuccess,
}: CancelOrderDialogProps) {
	const [cancellationReason, setCancellationReason] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async () => {
		// Validate cancellation reason
		if (cancellationReason.trim().length < 10) {
			toast({
				variant: "destructive",
				title: "Invalid Reason",
				description: "Cancellation reason must be at least 10 characters",
			});
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`/api/protected/orders/${order.id}/cancel`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ cancellation_reason: cancellationReason }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to cancel order");
			}

			toast({
				title: "Success",
				description: "Order cancelled successfully",
			});

			onOpenChange(false);
			setCancellationReason(""); // Reset for next use
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error("Error cancelling order:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to cancel order",
			});
		} finally {
			setLoading(false);
		}
	};

	// Check if order is already cancelled
	if (order.order_status === OrderStatus.Cancelled) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Order Already Cancelled</DialogTitle>
						<DialogDescription>
							This order has already been cancelled
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<div className="p-4 bg-muted rounded-lg">
							<div className="text-sm font-medium mb-1">
								Cancellation Reason:
							</div>
							<div className="text-sm text-muted-foreground">
								{order.cancellation_reason || "No reason provided"}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => onOpenChange(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cancel Order</DialogTitle>
					<DialogDescription>
						Cancel order #{order.id} and provide a reason
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Warning */}
					<div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
						<AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
						<div className="space-y-1">
							<div className="text-sm font-medium">
								This action will cancel the order
							</div>
							<div className="text-sm text-muted-foreground">
								The order status will be changed to "Cancelled" and the
								cancellation will be recorded with your user information.
							</div>
						</div>
					</div>

					{/* Cancellation Reason */}
					<div className="space-y-2">
						<label className="text-sm font-medium">
							Cancellation Reason <span className="text-destructive">*</span>
						</label>
						<Textarea
							placeholder="Enter the reason for cancelling this order (minimum 10 characters)..."
							value={cancellationReason}
							onChange={(e) => setCancellationReason(e.target.value)}
							rows={4}
							className="resize-none"
						/>
						<div className="text-xs text-muted-foreground">
							{cancellationReason.length} / 10 characters minimum
						</div>
					</div>

					{/* Order Info */}
					<div className="p-4 bg-muted rounded-lg space-y-2">
						<div className="text-sm font-medium">Order Information</div>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="text-muted-foreground">Order ID:</span> #
								{order.id}
							</div>
							<div>
								<span className="text-muted-foreground">Total:</span>{" "}
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "EGP",
								}).format(order.total_amount)}
							</div>
							<div>
								<span className="text-muted-foreground">Patient:</span>{" "}
								{[order.patient?.first_name, order.patient?.last_name]
									.filter(Boolean)
									.join(" ")}
							</div>
							<div>
								<span className="text-muted-foreground">Items:</span>{" "}
								{order.items_count}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Keep Order
					</Button>
					<Button
						variant="destructive"
						onClick={handleSubmit}
						disabled={loading || cancellationReason.trim().length < 10}
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Cancel Order
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
