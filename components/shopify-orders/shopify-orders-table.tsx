"use client";

import { useState, useEffect, useCallback } from "react";
import {
	MoreHorizontal,
	Eye,
	Search,
	Package,
	ExternalLink,
	AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import type {
	ShopifyMoney,
	ShopifyOrderRow,
	ShopifyOrdersPageInfo,
} from "@/types/shopify-order-types";
import { format } from "date-fns";
import { ShopifyOrderDetailsSheet } from "./shopify-order-details-sheet";

// Configuration/token problems (empty or wrong SHOPIFY_ADMIN_ACCESS_TOKEN,
// missing scopes) are surfaced as a prominent card instead of the table.
const isConfigError = (message: string) =>
	message.includes("SHOPIFY_ADMIN_ACCESS_TOKEN") ||
	message.startsWith("Shopify GraphQL error");

export function ShopifyOrdersTable() {
	const [orders, setOrders] = useState<ShopifyOrderRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [configError, setConfigError] = useState<string | null>(null);
	const [pageInfo, setPageInfo] = useState<ShopifyOrdersPageInfo | null>(null);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [financialStatus, setFinancialStatus] = useState("all");
	const [fulfillmentStatus, setFulfillmentStatus] = useState("all");

	// Cursor stack: Next pushes the current page's end cursor, Previous pops.
	// The current `after` cursor is the last element (empty stack = first page).
	const [cursors, setCursors] = useState<string[]>([]);

	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [showDetailsSheet, setShowDetailsSheet] = useState(false);

	const { toast } = useToast();

	const fetchOrders = useCallback(async () => {
		setLoading(true);
		setError(null);
		setConfigError(null);
		try {
			const params = new URLSearchParams();
			if (search) params.append("search", search);
			if (financialStatus !== "all")
				params.append("financial_status", financialStatus);
			if (fulfillmentStatus !== "all")
				params.append("fulfillment_status", fulfillmentStatus);
			const after = cursors[cursors.length - 1];
			if (after) params.append("after", after);

			const res = await fetch(
				`/api/protected/shopify-orders?${params.toString()}`
			);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || `Error: ${res.statusText}`);
			}
			const result = await res.json();
			setOrders(result.data);
			setPageInfo(result.pageInfo);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load Shopify orders";
			if (isConfigError(message)) {
				setConfigError(message);
			} else {
				setError(message);
				toast({ variant: "destructive", title: "Error", description: message });
			}
		} finally {
			setLoading(false);
		}
	}, [search, financialStatus, fulfillmentStatus, cursors, toast]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCursors([]);
		setSearch(searchInput);
	};

	const handleNextPage = () => {
		if (pageInfo?.end_cursor) {
			setCursors([...cursors, pageInfo.end_cursor]);
		}
	};

	const handlePreviousPage = () => {
		setCursors(cursors.slice(0, -1));
	};

	const handleViewDetails = (order: ShopifyOrderRow) => {
		setSelectedOrderId(order.legacy_id);
		setShowDetailsSheet(true);
	};

	const formatStatusLabel = (status: string) => {
		const label = status.replace(/_/g, " ").toLowerCase();
		return label.charAt(0).toUpperCase() + label.slice(1);
	};

	const getPaymentBadge = (status: string | null) => {
		if (!status) return <span className="text-muted-foreground">—</span>;
		const classNames: Record<string, string> = {
			PAID: "bg-green-500/20 text-green-600",
			PENDING: "bg-amber-500/20 text-amber-600",
			REFUNDED: "bg-zinc-500/10 text-muted-foreground",
			PARTIALLY_REFUNDED: "bg-zinc-500/10 text-muted-foreground",
		};
		return (
			<Badge
				variant="outline"
				className={classNames[status] || "bg-zinc-500/10 text-muted-foreground"}
			>
				{formatStatusLabel(status)}
			</Badge>
		);
	};

	const getFulfillmentBadge = (status: string | null) => {
		if (!status) return <span className="text-muted-foreground">—</span>;
		const classNames: Record<string, string> = {
			FULFILLED: "bg-green-500/20 text-green-600",
			UNFULFILLED: "bg-amber-500/20 text-amber-600",
			PARTIALLY_FULFILLED: "bg-blue-500/20 text-blue-600",
		};
		return (
			<Badge
				variant="outline"
				className={classNames[status] || "bg-zinc-500/10 text-muted-foreground"}
			>
				{formatStatusLabel(status)}
			</Badge>
		);
	};

	const formatCurrency = (money: ShopifyMoney) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: money.currency_code,
		}).format(Number(money.amount));
	};

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "MMM dd, yyyy HH:mm");
	};

	if (configError) {
		return (
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Cannot load Shopify orders
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm">{configError}</p>
					<ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
						<li>
							In Shopify admin, go to Settings → Apps and sales channels →
							Develop apps and create a custom app.
						</li>
						<li>
							Grant it the <code>read_orders</code> and{" "}
							<code>read_customers</code> Admin API scopes.
						</li>
						<li>
							Install the app and paste its Admin API access token (
							<code>shpat_...</code>) as <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code>{" "}
							in the dashboard env.
						</li>
						<li>Restart the dashboard.</li>
					</ol>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
				<form onSubmit={handleSearch} className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by order # or email..."
							className="pl-10"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</form>
				<Select
					value={financialStatus}
					onValueChange={(value) => {
						setCursors([]);
						setFinancialStatus(value);
					}}
				>
					<SelectTrigger className="w-full md:w-[180px]">
						<SelectValue placeholder="Payment" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All payments</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="refunded">Refunded</SelectItem>
						<SelectItem value="partially_refunded">
							Partially refunded
						</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={fulfillmentStatus}
					onValueChange={(value) => {
						setCursors([]);
						setFulfillmentStatus(value);
					}}
				>
					<SelectTrigger className="w-full md:w-[180px]">
						<SelectValue placeholder="Fulfillment" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All fulfillments</SelectItem>
						<SelectItem value="fulfilled">Fulfilled</SelectItem>
						<SelectItem value="unfulfilled">Unfulfilled</SelectItem>
						<SelectItem value="partial">Partial</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col space-y-4 bg-card rounded-lg border border-border">
				<div className="rounded-md">
					<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Order</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Customer</TableHead>
								<TableHead>Items</TableHead>
								<TableHead>Total</TableHead>
								<TableHead>Payment</TableHead>
								<TableHead>Fulfillment</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`loading-${i}`}>
										{Array.from({ length: 8 }).map((__, j) => (
											<TableCell key={j}>
												<div className="h-4 w-24 bg-muted animate-pulse rounded" />
											</TableCell>
										))}
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center py-8 text-destructive"
									>
										{error}
									</TableCell>
								</TableRow>
							) : orders.length > 0 ? (
								orders.map((order) => (
									<TableRow key={order.id}>
										<TableCell>
											<span className="font-medium">{order.name}</span>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{formatDate(order.created_at)}
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium">
													{order.customer_name || "—"}
												</div>
												<div className="text-sm text-muted-foreground">
													{order.customer_email || ""}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="gap-1">
												<Package className="h-3 w-3" />
												{order.item_count}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="font-semibold">
												{formatCurrency(order.total)}
											</div>
										</TableCell>
										<TableCell>
											{getPaymentBadge(order.financial_status)}
										</TableCell>
										<TableCell>
											{getFulfillmentBadge(order.fulfillment_status)}
										</TableCell>
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
															View details
														</DropdownMenuItem>
													</PermissionGate>
													<DropdownMenuItem asChild>
														<a
															href={order.admin_url}
															target="_blank"
															rel="noopener noreferrer"
														>
															<ExternalLink className="mr-2 h-4 w-4" />
															Open in Shopify
														</a>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={8} className="text-center py-8">
										No orders found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
					</div>
				</div>

				{/* Keep Previous reachable even when a stale cursor lands on an empty page */}
				{!loading && !error && (orders.length > 0 || cursors.length > 0) && (
					<div className="flex items-center justify-end px-4 py-2">
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePreviousPage}
								disabled={cursors.length === 0}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleNextPage}
								disabled={!pageInfo?.has_next}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>

			<ShopifyOrderDetailsSheet
				open={showDetailsSheet}
				onOpenChange={setShowDetailsSheet}
				orderId={selectedOrderId}
			/>
		</>
	);
}
