"use client";

import { useState, useEffect } from "react";
import {
	MoreHorizontal,
	Eye,
	Edit,
	Ban,
	Copy,
	Package,
	CheckCircle,
} from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import {
	OrderFilters,
	OrderWithDetails,
	OrderStatus,
	PaymentStatus,
	PaymentMethod,
	OrderType,
} from "@/types/order-types";
import { format } from "date-fns";
import { OrderDetailsSheet } from "./order-details-sheet";
import { StatusChangeDialog } from "./status-change-dialog";
import { CancelOrderDialog } from "./cancel-order-dialog";

interface OrdersTableProps {
	filters: OrderFilters;
	onOrderUpdate?: () => void;
}

export function OrdersTable({ filters, onOrderUpdate }: OrdersTableProps) {
	const [orders, setOrders] = useState<OrderWithDetails[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalOrders, setTotalOrders] = useState(0);
	const itemsPerPage = 10;

	const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
		null
	);
	const [showDetailsSheet, setShowDetailsSheet] = useState(false);
	const [showStatusDialog, setShowStatusDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	const { toast } = useToast();

	useEffect(() => {
		fetchOrders();
	}, [page, filters]);

	const fetchOrders = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
			});

			if (filters.search) params.append("search", filters.search);
			if (filters.order_status.length > 0)
				params.append("order_status", filters.order_status.join(","));
			if (filters.payment_status.length > 0)
				params.append("payment_status", filters.payment_status.join(","));
			if (filters.payment_method.length > 0)
				params.append("payment_method", filters.payment_method.join(","));
			if (filters.order_type.length > 0)
				params.append("order_type", filters.order_type.join(","));
			if (filters.dateRange.from)
				params.append("date_from", filters.dateRange.from.toISOString());
			if (filters.dateRange.to)
				params.append("date_to", filters.dateRange.to.toISOString());

			const response = await fetch(
				`/api/protected/orders?${params.toString()}`
			);

			if (!response.ok) {
				throw new Error("Failed to fetch orders");
			}

			const result = await response.json();
			setOrders(result.data);
			setTotalPages(result.meta.totalPages);
			setTotalOrders(result.meta.total);
		} catch (error) {
			console.error("Error fetching orders:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load orders",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleViewDetails = (order: OrderWithDetails) => {
		setSelectedOrder(order);
		setShowDetailsSheet(true);
	};

	const handleChangeStatus = (order: OrderWithDetails) => {
		setSelectedOrder(order);
		setShowStatusDialog(true);
	};

	const handleCancelOrder = (order: OrderWithDetails) => {
		setSelectedOrder(order);
		setShowCancelDialog(true);
	};

	const handleCopyPaymobId = (paymobId: string | null, label: string) => {
		if (paymobId) {
			navigator.clipboard.writeText(paymobId);
			toast({
				title: "Copied!",
				description: `${label} copied to clipboard`,
			});
		}
	};

	const handleOrderUpdated = () => {
		fetchOrders();
		if (onOrderUpdate) onOrderUpdate();
	};

	const getOrderStatusBadge = (status: OrderStatus) => {
		const variants: Record<
			OrderStatus,
			{ variant: string; className: string }
		> = {
			[OrderStatus.Pending]: {
				variant: "outline",
				className: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
			},
			[OrderStatus.Confirmed]: {
				variant: "outline",
				className: "bg-blue-500/20 text-blue-700 border-blue-500/30",
			},
			[OrderStatus.Shipped]: {
				variant: "outline",
				className: "bg-purple-500/20 text-purple-700 border-purple-500/30",
			},
			[OrderStatus.Delivered]: {
				variant: "outline",
				className: "bg-green-500/20 text-green-700 border-green-500/30",
			},
			[OrderStatus.Cancelled]: {
				variant: "destructive",
				className: "bg-red-500/20 text-red-700 border-red-500/30",
			},
		};

		const config = variants[status];
		return (
			<Badge variant="outline" className={config.className}>
				{status}
			</Badge>
		);
	};

	const getPaymentStatusBadge = (status: PaymentStatus) => {
		const variants: Record<
			PaymentStatus,
			{ variant: string; className: string }
		> = {
			[PaymentStatus.Pending]: {
				variant: "secondary",
				className: "bg-gray-500/20 text-gray-700",
			},
			[PaymentStatus.Completed]: {
				variant: "outline",
				className: "bg-green-500/20 text-green-700 border-green-500/30",
			},
			[PaymentStatus.Failed]: {
				variant: "destructive",
				className: "bg-red-500/20 text-red-700 border-red-500/30",
			},
			[PaymentStatus.Refunded]: {
				variant: "outline",
				className: "bg-orange-500/20 text-orange-700 border-orange-500/30",
			},
		};

		const config = variants[status];
		return (
			<Badge variant="secondary" className={config.className}>
				{status}
			</Badge>
		);
	};

	const formatPaymentMethod = (method: PaymentMethod) => {
		return method === PaymentMethod.CashOnDelivery
			? "Cash on Delivery"
			: "Online";
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EGP",
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "MMM dd, yyyy HH:mm");
	};

	return (
		<>
			<div className="flex flex-col space-y-4 bg-card rounded-lg border">
				<div className="rounded-md">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Order ID</TableHead>
								<TableHead>Patient</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Total</TableHead>
								<TableHead>Payment</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Items</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								// Loading state
								Array.from({ length: itemsPerPage }).map((_, index) => (
									<TableRow key={`loading-${index}`}>
										<TableCell>
											<div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
												<div className="space-y-2">
													<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
													<div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
										</TableCell>
										<TableCell>
											<div className="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
										</TableCell>
										<TableCell>
											<div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												<div className="h-5 w-24 bg-muted animate-pulse rounded-full"></div>
												<div className="h-5 w-20 bg-muted animate-pulse rounded-full"></div>
											</div>
										</TableCell>
										<TableCell>
											<div className="h-5 w-20 bg-muted animate-pulse rounded-full"></div>
										</TableCell>
										<TableCell>
											<div className="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
										</TableCell>
										<TableCell>
											<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
										</TableCell>
									</TableRow>
								))
							) : orders.length > 0 ? (
								orders.map((order) => (
									<TableRow key={order.id}>
										{/* Order ID with Paymob tooltip */}
										<TableCell>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="font-mono font-medium cursor-help">
															#{order.id}
														</div>
													</TooltipTrigger>
													<TooltipContent side="right" className="max-w-xs">
														<div className="space-y-2">
															{order.paymob_order_id && (
																<div className="text-xs">
																	<div className="font-semibold">
																		Paymob Order ID:
																	</div>
																	<div className="font-mono">
																		{order.paymob_order_id}
																	</div>
																</div>
															)}
															{order.paymob_transaction_id && (
																<div className="text-xs">
																	<div className="font-semibold">
																		Transaction ID:
																	</div>
																	<div className="font-mono">
																		{order.paymob_transaction_id}
																	</div>
																</div>
															)}
															{order.paymob_payment_key && (
																<div className="text-xs">
																	<div className="font-semibold">
																		Payment Key:
																	</div>
																	<div className="font-mono break-all">
																		{order.paymob_payment_key.substring(0, 20)}
																		...
																	</div>
																</div>
															)}
															{!order.paymob_order_id &&
																!order.paymob_transaction_id &&
																!order.paymob_payment_key && (
																	<div className="text-xs text-muted-foreground">
																		No Paymob IDs available
																	</div>
																)}
														</div>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</TableCell>

										{/* Patient info */}
										<TableCell>
											<div className="flex items-center space-x-3">
												<Avatar className="h-8 w-8">
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
												<div>
													<div className="font-medium">
														{[
															order.patient?.first_name,
															order.patient?.last_name,
														]
															.filter(Boolean)
															.join(" ") || "Unknown"}
													</div>
													<div className="text-sm text-muted-foreground">
														{order.patient?.email ||
															order.patient?.phone_number}
													</div>
												</div>
											</div>
										</TableCell>

										{/* Order date */}
										<TableCell>
											<div className="text-sm">
												{formatDate(order.order_date)}
											</div>
										</TableCell>

										{/* Order type */}
										<TableCell>
											<Badge
												variant={
													order.order_type === OrderType.Purchase
														? "default"
														: "secondary"
												}
											>
												{order.order_type}
											</Badge>
										</TableCell>

										{/* Total amount */}
										<TableCell>
											<div className="font-semibold">
												{formatCurrency(order.total_amount)}
											</div>
										</TableCell>

										{/* Payment info (stacked) */}
										<TableCell>
											<div className="space-y-1">
												<div className="text-xs text-muted-foreground">
													{formatPaymentMethod(order.payment_method)}
												</div>
												{getPaymentStatusBadge(order.payment_status)}
											</div>
										</TableCell>

										{/* Order status */}
										<TableCell>
											{getOrderStatusBadge(order.order_status)}
										</TableCell>

										{/* Items count */}
										<TableCell>
											<Badge variant="outline" className="gap-1">
												<Package className="h-3 w-3" />
												{order.items_count}
											</Badge>
										</TableCell>

										{/* Actions */}
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">Open menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<PermissionGate
														permissions={[Permission.ViewOrderDetails]}
													>
														<DropdownMenuItem
															onClick={() => handleViewDetails(order)}
														>
															<Eye className="mr-2 h-4 w-4" />
															View Details
														</DropdownMenuItem>
													</PermissionGate>

													<PermissionGate
														permissions={[Permission.UpdateOrderStatus]}
													>
														<DropdownMenuItem
															onClick={() => handleChangeStatus(order)}
														>
															<Edit className="mr-2 h-4 w-4" />
															Change Status
														</DropdownMenuItem>
													</PermissionGate>

													{order.paymob_order_id && (
														<>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() =>
																	handleCopyPaymobId(
																		order.paymob_order_id,
																		"Paymob Order ID"
																	)
																}
															>
																<Copy className="mr-2 h-4 w-4" />
																Copy Paymob Order ID
															</DropdownMenuItem>
														</>
													)}

													{order.order_status !== OrderStatus.Cancelled && (
														<PermissionGate
															permissions={[Permission.CancelOrder]}
														>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() => handleCancelOrder(order)}
																className="text-destructive"
															>
																<Ban className="mr-2 h-4 w-4" />
																Cancel Order
															</DropdownMenuItem>
														</PermissionGate>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								// Empty state
								<TableRow>
									<TableCell colSpan={9} className="text-center py-8">
										No orders found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{!loading && orders.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-sm text-muted-foreground">
							Showing {Math.min(totalOrders, (page - 1) * itemsPerPage + 1)} to{" "}
							{Math.min(totalOrders, page * itemsPerPage)} of {totalOrders}{" "}
							orders
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page - 1)}
								disabled={page === 1}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page + 1)}
								disabled={page === totalPages}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Dialogs and Sheets */}
			{selectedOrder && (
				<>
					<OrderDetailsSheet
						order={selectedOrder}
						open={showDetailsSheet}
						onOpenChange={setShowDetailsSheet}
						onOrderUpdate={handleOrderUpdated}
						onChangeStatus={() => {
							setShowDetailsSheet(false);
							setShowStatusDialog(true);
						}}
						onCancelOrder={() => {
							setShowDetailsSheet(false);
							setShowCancelDialog(true);
						}}
					/>
					<StatusChangeDialog
						order={selectedOrder}
						open={showStatusDialog}
						onOpenChange={setShowStatusDialog}
						onSuccess={handleOrderUpdated}
					/>
					<CancelOrderDialog
						order={selectedOrder}
						open={showCancelDialog}
						onOpenChange={setShowCancelDialog}
						onSuccess={handleOrderUpdated}
					/>
				</>
			)}
		</>
	);
}
