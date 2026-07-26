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
import { Separator } from "@/components/ui/separator";
import {
	CreditCard,
	ExternalLink,
	MapPin,
	Package,
	StickyNote,
	Truck,
	User,
} from "lucide-react";
import type {
	ShopifyMoney,
	ShopifyOrderAddress,
	ShopifyOrderDetail,
} from "@/types/shopify-order-types";
import { format } from "date-fns";

interface ShopifyOrderDetailsSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string | null; // legacy numeric id
}

export function ShopifyOrderDetailsSheet({
	open,
	onOpenChange,
	orderId,
}: ShopifyOrderDetailsSheetProps) {
	const [order, setOrder] = useState<ShopifyOrderDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !orderId) return;
		let cancelled = false;
		const fetchOrder = async () => {
			setLoading(true);
			setError(null);
			setOrder(null);
			try {
				const res = await fetch(`/api/protected/shopify-orders/${orderId}`);
				if (!res.ok) {
					const e = await res.json().catch(() => ({}));
					throw new Error(e.error || `Error: ${res.statusText}`);
				}
				const result = await res.json();
				if (!cancelled) setOrder(result.data);
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err.message
							: "Failed to load order details"
					);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchOrder();
		return () => {
			cancelled = true;
		};
	}, [open, orderId]);

	const formatCurrency = (money: ShopifyMoney | null) => {
		if (!money) return "—";
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: money.currency_code,
		}).format(Number(money.amount));
	};

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "MMM dd, yyyy HH:mm");
	};

	const formatStatusLabel = (status: string) => {
		const label = status.replace(/_/g, " ").toLowerCase();
		return label.charAt(0).toUpperCase() + label.slice(1);
	};

	const getPaymentBadge = (status: string | null) => {
		if (!status) return null;
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
		if (!status) return null;
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

	const renderAddress = (address: ShopifyOrderAddress | null) => {
		if (!address) {
			return <div className="text-sm text-muted-foreground">—</div>;
		}
		const lines = [
			address.name,
			address.address1,
			address.address2,
			[address.city, address.province, address.zip].filter(Boolean).join(", "),
			address.country,
			address.phone,
		].filter(Boolean);
		if (lines.length === 0) {
			return <div className="text-sm text-muted-foreground">—</div>;
		}
		return (
			<div className="text-sm text-muted-foreground space-y-0.5">
				{lines.map((line, i) => (
					<div key={i}>{line}</div>
				))}
			</div>
		);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:w-[40%] sm:max-w-none overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{order ? `Order ${order.name}` : "Order Details"}
					</SheetTitle>
					<SheetDescription>
						{loading
							? "Loading order information..."
							: "Shopify order information. Read-only - manage it in Shopify admin."}
					</SheetDescription>
				</SheetHeader>

				{loading ? (
					<div className="space-y-6 mt-6">
						<div className="h-32 bg-muted animate-pulse rounded"></div>
						<div className="h-64 bg-muted animate-pulse rounded"></div>
					</div>
				) : error ? (
					<div className="mt-6 text-sm text-destructive">{error}</div>
				) : order ? (
					<div className="space-y-6 mt-6">
						{/* Header */}
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								{getPaymentBadge(order.financial_status)}
								{getFulfillmentBadge(order.fulfillment_status)}
							</div>
							<div className="text-sm text-muted-foreground">
								Created {formatDate(order.created_at)}
							</div>
							<Button variant="outline" size="sm" asChild>
								<a
									href={order.admin_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Open in Shopify
								</a>
							</Button>
						</div>

						<Separator />

						{/* Customer */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg flex items-center gap-2">
								<User className="h-5 w-5" />
								Customer
							</h3>
							<div className="p-4 bg-muted/50 rounded-lg space-y-1 text-sm">
								<div className="font-medium">
									{order.customer_name || "—"}
								</div>
								<div className="text-muted-foreground">
									{order.customer_email || "—"}
								</div>
								<div className="text-muted-foreground">
									{order.customer_phone || "—"}
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
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="p-4 bg-muted/50 rounded-lg">
									<div className="font-medium text-sm mb-2">
										Shipping Address
									</div>
									{renderAddress(order.shipping_address)}
								</div>
								<div className="p-4 bg-muted/50 rounded-lg">
									<div className="font-medium text-sm mb-2">
										Billing Address
									</div>
									{renderAddress(order.billing_address)}
								</div>
							</div>
						</div>

						<Separator />

						{/* Items */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg flex items-center gap-2">
								<Package className="h-5 w-5" />
								Items ({order.line_items.length})
							</h3>
							<div className="border rounded-lg divide-y">
								{order.line_items.map((item, i) => (
									<div key={i} className="flex items-center gap-3 p-3">
										{item.image_url ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={item.image_url}
												alt={item.title}
												className="h-10 w-10 rounded object-cover bg-muted shrink-0"
											/>
										) : (
											<div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
												<Package className="h-5 w-5 text-muted-foreground" />
											</div>
										)}
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate">
												{item.title}
											</div>
											<div className="text-xs text-muted-foreground">
												{[item.variant_title, item.sku && `SKU: ${item.sku}`]
													.filter(Boolean)
													.join(" · ")}
											</div>
											<div className="text-xs text-muted-foreground">
												{item.quantity} × {formatCurrency(item.unit_price)}
											</div>
										</div>
										<div className="text-sm font-medium text-right">
											{formatCurrency(item.line_total)}
										</div>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Totals */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								Totals
							</h3>
							<div className="space-y-2 p-4 bg-muted/50 rounded-lg">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Subtotal</span>
									<span>{formatCurrency(order.subtotal)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Shipping</span>
									<span>{formatCurrency(order.total_shipping)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Tax</span>
									<span>{formatCurrency(order.total_tax)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Discounts</span>
									<span>{formatCurrency(order.total_discounts)}</span>
								</div>
								<Separator />
								<div className="flex justify-between font-semibold text-lg">
									<span>Total</span>
									<span>{formatCurrency(order.total)}</span>
								</div>
							</div>
						</div>

						{/* Tracking */}
						{order.tracking.length > 0 && (
							<>
								<Separator />
								<div className="space-y-4">
									<h3 className="font-semibold text-lg flex items-center gap-2">
										<Truck className="h-5 w-5" />
										Tracking
									</h3>
									<div className="p-4 bg-muted/50 rounded-lg space-y-2">
										{order.tracking.map((info, i) => (
											<div key={i} className="text-sm">
												{info.url && info.number ? (
													<a
														href={info.url}
														target="_blank"
														rel="noopener noreferrer"
														className="font-medium underline underline-offset-4"
													>
														{info.number}
													</a>
												) : (
													<span className="font-medium">
														{info.number || "—"}
													</span>
												)}
												{info.company && (
													<span className="text-muted-foreground">
														{" "}
														· {info.company}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							</>
						)}

						{/* Note + tags */}
						{(order.note || order.tags.length > 0) && (
							<>
								<Separator />
								<div className="space-y-4">
									<h3 className="font-semibold text-lg flex items-center gap-2">
										<StickyNote className="h-5 w-5" />
										Notes
									</h3>
									<div className="p-4 bg-muted/50 rounded-lg space-y-3">
										{order.note && (
											<div className="text-sm text-muted-foreground">
												{order.note}
											</div>
										)}
										{order.tags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{order.tags.map((tag) => (
													<Badge key={tag} variant="outline">
														{tag}
													</Badge>
												))}
											</div>
										)}
									</div>
								</div>
							</>
						)}
					</div>
				) : null}
			</SheetContent>
		</Sheet>
	);
}
