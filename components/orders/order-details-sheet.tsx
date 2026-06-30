"use client";

import { useState, useEffect } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Copy,
	MapPin,
	Phone,
	Mail,
	Package,
	Calendar,
	CreditCard,
	Edit,
	Ban,
	User,
	CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import {
	OrderWithDetails,
	OrderStatus,
	PaymentStatus,
	OrderType,
} from "@/types/order-types";
import { format } from "date-fns";

interface OrderDetailsSheetProps {
	order: OrderWithDetails;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onOrderUpdate?: () => void;
	onChangeStatus?: () => void;
	onCancelOrder?: () => void;
}

export function OrderDetailsSheet({
	order: initialOrder,
	open,
	onOpenChange,
	onOrderUpdate,
	onChangeStatus,
	onCancelOrder,
}: OrderDetailsSheetProps) {
	const [order, setOrder] = useState(initialOrder);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const fetchOrderDetails = async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/protected/orders/${initialOrder.id}`);
			if (!response.ok) throw new Error("Failed to fetch order details");
			const result = await response.json();
			setOrder(result.data);
		} catch (error) {
			console.error("Error fetching order details:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load order details",
			});
		} finally {
			setLoading(false);
		}
	};

	// Fetch full order details when sheet opens
	useEffect(() => {
		if (open && initialOrder.id) {
			fetchOrderDetails();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, initialOrder.id]);

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast({
			title: "Copied!",
			description: `${label} copied to clipboard`,
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EGP",
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "PPP 'at' p");
	};

	const formatAddress = (address: any) => {
		if (!address) return "No address provided";
		const parts = [
			address.street_address,
			address.city,
			address.state,
			address.postal_code,
			address.country,
		].filter(Boolean);
		return parts.join(", ");
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

	if (loading) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-full sm:w-[600px] sm:max-w-none overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Order Details</SheetTitle>
						<SheetDescription>Loading order information...</SheetDescription>
					</SheetHeader>
					<div className="space-y-6 mt-6">
						<div className="h-32 bg-muted animate-pulse rounded"></div>
						<div className="h-64 bg-muted animate-pulse rounded"></div>
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:w-[600px] sm:max-w-none overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Order #{order.id}</SheetTitle>
					<SheetDescription>
						Comprehensive order information and details
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-6 mt-6">
					{/* Order Overview */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<Package className="h-5 w-5" />
							Order Overview
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
							<div>
								<div className="text-sm text-muted-foreground">Order Type</div>
								<Badge
									variant={
										order.order_type === OrderType.Purchase
											? "default"
											: "secondary"
									}
									className="mt-1"
								>
									{order.order_type}
								</Badge>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">Order Date</div>
								<div className="text-sm font-medium mt-1">
									{formatDate(order.order_date)}
								</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">
									Order Status
								</div>
								<Badge
									variant="outline"
									className={`mt-1 ${getStatusColor(order.order_status)}`}
								>
									{order.order_status}
								</Badge>
							</div>
							{order.delivery_date && (
								<div>
									<div className="text-sm text-muted-foreground">
										Delivered On
									</div>
									<div className="text-sm font-medium mt-1">
										{formatDate(order.delivery_date)}
									</div>
								</div>
							)}
						</div>

						{/* Paymob IDs */}
						{(order.paymob_order_id ||
							order.paymob_transaction_id ||
							order.paymob_payment_key) && (
							<div className="space-y-2 p-4 bg-muted/50 rounded-lg">
								<div className="text-sm font-semibold">Paymob Information</div>
								{order.paymob_order_id && (
									<div className="flex items-center justify-between">
										<div>
											<div className="text-xs text-muted-foreground">
												Order ID
											</div>
											<div className="text-sm font-mono">
												{order.paymob_order_id}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleCopy(order.paymob_order_id!, "Paymob Order ID")
											}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								)}
								{order.paymob_transaction_id && (
									<div className="flex items-center justify-between">
										<div>
											<div className="text-xs text-muted-foreground">
												Transaction ID
											</div>
											<div className="text-sm font-mono">
												{order.paymob_transaction_id}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleCopy(
													order.paymob_transaction_id!,
													"Transaction ID"
												)
											}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								)}
								{order.paymob_payment_key && (
									<div className="flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<div className="text-xs text-muted-foreground">
												Payment Key
											</div>
											<div className="text-sm font-mono truncate">
												{order.paymob_payment_key}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleCopy(order.paymob_payment_key!, "Payment Key")
											}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								)}
							</div>
						)}
					</div>

					<Separator />

					{/* Patient Information */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient Information
						</h3>
						<div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
							<Avatar className="h-12 w-12">
								<AvatarImage
									src={order.patient?.image_url || "/placeholder.svg"}
									alt={order.patient?.first_name || "Patient"}
								/>
								<AvatarFallback>
									{order.patient?.first_name?.charAt(0) ||
										order.patient?.last_name?.charAt(0) ||
										"P"}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-2">
								<div className="font-semibold">
									{[order.patient?.first_name, order.patient?.last_name]
										.filter(Boolean)
										.join(" ") || "Unknown"}
								</div>
								{order.patient?.phone_number && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Phone className="h-4 w-4" />
										{order.patient.phone_number}
									</div>
								)}
								{order.patient?.email && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Mail className="h-4 w-4" />
										{order.patient.email}
									</div>
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* Addresses */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<MapPin className="h-5 w-5" />
							Addresses
						</h3>
						<div className="grid grid-cols-1 gap-4">
							{/* Shipping Address */}
							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="font-medium text-sm mb-2">Shipping Address</div>
								<div className="text-sm text-muted-foreground">
									{formatAddress(order.shipping_address)}
								</div>
							</div>

							{/* Billing Address */}
							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="font-medium text-sm mb-2">Billing Address</div>
								<div className="text-sm text-muted-foreground">
									{formatAddress(order.billing_address)}
								</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Order Items */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<Package className="h-5 w-5" />
							Order Items ({order.order_items?.length || 0})
						</h3>
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Qty</TableHead>
										<TableHead>Price</TableHead>
										<TableHead className="text-right">Subtotal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{order.order_items?.map((item) => (
										<TableRow key={item.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10 rounded-md">
														<AvatarImage
															src={
																item.product?.image_url || "/placeholder.svg"
															}
															alt={item.product?.name || "Product"}
															className="object-cover"
														/>
														<AvatarFallback className="rounded-md">
															<Package className="h-5 w-5" />
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium">
															{item.product?.name}
														</div>
														{(item.rental_start_date ||
															item.rental_end_date) && (
															<div className="text-xs text-muted-foreground mt-1">
																Rental:{" "}
																{item.rental_start_date &&
																	format(
																		new Date(item.rental_start_date),
																		"MMM dd"
																	)}{" "}
																-{" "}
																{item.rental_end_date &&
																	format(
																		new Date(item.rental_end_date),
																		"MMM dd"
																	)}
															</div>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>{item.quantity}</TableCell>
											<TableCell>
												{formatCurrency(item.price_at_purchase)}
											</TableCell>
											<TableCell className="text-right">
												{formatCurrency(item.price_at_purchase * item.quantity)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>

					<Separator />

					{/* Order Summary */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Order Summary
						</h3>
						<div className="space-y-2 p-4 bg-muted/50 rounded-lg">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span>{formatCurrency(order.subtotal_amount)}</span>
							</div>
							{order.tax_amount > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Tax</span>
									<span>{formatCurrency(order.tax_amount)}</span>
								</div>
							)}
							{order.discount_amount > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Discount</span>
									<span className="text-green-600">
										-{formatCurrency(order.discount_amount)}
									</span>
								</div>
							)}
							{order.shipping_amount > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Shipping</span>
									<span>{formatCurrency(order.shipping_amount)}</span>
								</div>
							)}
							<Separator />
							<div className="flex justify-between font-semibold text-lg">
								<span>Total</span>
								<span>{formatCurrency(order.total_amount)}</span>
							</div>
							<Separator />
							<div className="space-y-1">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Payment Method</span>
									<span>
										{order.payment_method === "cash_on_delivery"
											? "Cash on Delivery"
											: "Online"}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Payment Status</span>
									<Badge
										variant={
											order.payment_status === PaymentStatus.Completed
												? "default"
												: "secondary"
										}
									>
										{order.payment_status}
									</Badge>
								</div>
							</div>
						</div>
					</div>

					{/* Cancellation Info */}
					{order.order_status === OrderStatus.Cancelled && (
						<>
							<Separator />
							<div className="space-y-4">
								<h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
									<Ban className="h-5 w-5" />
									Cancellation Information
								</h3>
								<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
									<div>
										<div className="text-sm font-medium">Reason</div>
										<div className="text-sm text-muted-foreground mt-1">
											{order.cancellation_reason || "No reason provided"}
										</div>
									</div>
									{order.cancellation_date && (
										<div>
											<div className="text-sm font-medium">Cancelled On</div>
											<div className="text-sm text-muted-foreground mt-1">
												{formatDate(order.cancellation_date)}
											</div>
										</div>
									)}
									{order.cancelled_by_user && (
										<div>
											<div className="text-sm font-medium">Cancelled By</div>
											<div className="text-sm text-muted-foreground mt-1">
												{[
													order.cancelled_by_user.first_name,
													order.cancelled_by_user.last_name,
												]
													.filter(Boolean)
													.join(" ")}
											</div>
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{/* Quick Actions */}
					<div className="flex flex-col sm:flex-row gap-2 pt-4">
						<PermissionGate permissions={[Permission.UpdateOrderStatus]}>
							<Button onClick={onChangeStatus} className="flex-1">
								<Edit className="mr-2 h-4 w-4" />
								Change Status
							</Button>
						</PermissionGate>
						{order.order_status !== OrderStatus.Cancelled && (
							<PermissionGate permissions={[Permission.CancelOrder]}>
								<Button
									variant="destructive"
									onClick={onCancelOrder}
									className="flex-1"
								>
									<Ban className="mr-2 h-4 w-4" />
									Cancel Order
								</Button>
							</PermissionGate>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
