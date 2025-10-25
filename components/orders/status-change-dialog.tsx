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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { OrderWithDetails, OrderStatus } from "@/types/order-types";
import { Loader2 } from "lucide-react";

interface StatusChangeDialogProps {
	order: OrderWithDetails;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function StatusChangeDialog({
	order,
	open,
	onOpenChange,
	onSuccess,
}: StatusChangeDialogProps) {
	const [newStatus, setNewStatus] = useState<OrderStatus>(order.order_status);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async () => {
		if (newStatus === order.order_status) {
			toast({
				variant: "destructive",
				title: "No Change",
				description: "Please select a different status",
			});
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`/api/protected/orders/${order.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ order_status: newStatus }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update order status");
			}

			toast({
				title: "Success",
				description: "Order status updated successfully",
			});

			onOpenChange(false);
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error("Error updating order status:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to update order status",
			});
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: OrderStatus) => {
		const colors = {
			[OrderStatus.Pending]: "bg-yellow-500/20 text-yellow-700",
			[OrderStatus.Confirmed]: "bg-blue-500/20 text-blue-700",
			[OrderStatus.Shipped]: "bg-purple-500/20 text-purple-700",
			[OrderStatus.Delivered]: "bg-green-500/20 text-green-700",
			[OrderStatus.Cancelled]: "bg-red-500/20 text-red-700",
		};
		return colors[status] || "";
	};

	const getStatusLabel = (status: OrderStatus) => {
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Order Status</DialogTitle>
					<DialogDescription>
						Update the status of order #{order.id}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Current Status */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Current Status</label>
						<div>
							<Badge
								variant="outline"
								className={getStatusColor(order.order_status)}
							>
								{getStatusLabel(order.order_status)}
							</Badge>
						</div>
					</div>

					{/* New Status */}
					<div className="space-y-2">
						<label className="text-sm font-medium">New Status</label>
						<Select
							value={newStatus}
							onValueChange={(value) => setNewStatus(value as OrderStatus)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={OrderStatus.Pending}>
									{getStatusLabel(OrderStatus.Pending)}
								</SelectItem>
								<SelectItem value={OrderStatus.Confirmed}>
									{getStatusLabel(OrderStatus.Confirmed)}
								</SelectItem>
								<SelectItem value={OrderStatus.Shipped}>
									{getStatusLabel(OrderStatus.Shipped)}
								</SelectItem>
								<SelectItem value={OrderStatus.Delivered}>
									{getStatusLabel(OrderStatus.Delivered)}
								</SelectItem>
								<SelectItem value={OrderStatus.Cancelled}>
									{getStatusLabel(OrderStatus.Cancelled)}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Preview New Status */}
					{newStatus !== order.order_status && (
						<div className="p-4 bg-muted rounded-lg">
							<div className="text-sm text-muted-foreground mb-2">
								New status will be:
							</div>
							<Badge variant="outline" className={getStatusColor(newStatus)}>
								{getStatusLabel(newStatus)}
							</Badge>
						</div>
					)}

					{/* Warning for Cancelled */}
					{newStatus === OrderStatus.Cancelled && (
						<div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
							<div className="text-sm text-yellow-700">
								⚠️ Tip: Use the "Cancel Order" action to provide a cancellation
								reason.
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Update Status
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
