"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	OrderFilters,
	OrderStatus,
	PaymentStatus,
	PaymentMethod,
	OrderType,
} from "@/types/order-types";
import { MultiSelectFilter } from "./multi-select-filter";
import { DateRangeFilter } from "@/components/analytics/date-range-filter";

interface OrdersHeaderProps {
	filters: OrderFilters;
	onFiltersChange: (filters: OrderFilters) => void;
	totalCount?: number;
}

export function OrdersHeader({
	filters,
	onFiltersChange,
	totalCount,
}: OrdersHeaderProps) {
	const [showFilters, setShowFilters] = useState(false);

	const handleSearchChange = (value: string) => {
		onFiltersChange({ ...filters, search: value });
	};

	const clearFilters = () => {
		onFiltersChange({
			search: "",
			order_status: [],
			payment_status: [],
			payment_method: [],
			order_type: [],
			dateRange: { from: null, to: null },
		});
	};

	const hasActiveFilters =
		filters.search ||
		filters.order_status.length > 0 ||
		filters.payment_status.length > 0 ||
		filters.payment_method.length > 0 ||
		filters.order_type.length > 0 ||
		filters.dateRange.from ||
		filters.dateRange.to;

	const activeFilterCount = [
		filters.search,
		filters.order_status.length > 0,
		filters.payment_status.length > 0,
		filters.payment_method.length > 0,
		filters.order_type.length > 0,
		filters.dateRange.from || filters.dateRange.to,
	].filter(Boolean).length;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-3xl font-bold tracking-tight">
						Order Management
					</h1>
					{totalCount !== undefined && (
						<Badge variant="secondary" className="text-sm">
							{totalCount} {totalCount === 1 ? "order" : "orders"}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button variant="outline" size="sm" onClick={clearFilters}>
							<X className="h-4 w-4 mr-2" />
							Clear Filters
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowFilters(!showFilters)}
					>
						<Filter className="h-4 w-4 mr-2" />
						Filters
						{activeFilterCount > 0 && (
							<Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
								{activeFilterCount}
							</Badge>
						)}
					</Button>
				</div>
			</div>

			{/* Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search by patient name, order ID, or Paymob IDs..."
					value={filters.search}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Filter Panel */}
			{showFilters && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border">
					{/* Order Status Filter */}
					<MultiSelectFilter
						label="Order Status"
						placeholder="Select statuses..."
						options={[
							{ label: "Pending", value: OrderStatus.Pending },
							{ label: "Confirmed", value: OrderStatus.Confirmed },
							{ label: "Shipped", value: OrderStatus.Shipped },
							{ label: "Delivered", value: OrderStatus.Delivered },
							{ label: "Cancelled", value: OrderStatus.Cancelled },
						]}
						value={filters.order_status}
						onChange={(value) =>
							onFiltersChange({
								...filters,
								order_status: value as OrderStatus[],
							})
						}
					/>

					{/* Payment Status Filter */}
					<MultiSelectFilter
						label="Payment Status"
						placeholder="Select statuses..."
						options={[
							{ label: "Pending", value: PaymentStatus.Pending },
							{ label: "Completed", value: PaymentStatus.Completed },
							{ label: "Failed", value: PaymentStatus.Failed },
							{ label: "Refunded", value: PaymentStatus.Refunded },
						]}
						value={filters.payment_status}
						onChange={(value) =>
							onFiltersChange({
								...filters,
								payment_status: value as PaymentStatus[],
							})
						}
					/>

					{/* Payment Method Filter */}
					<MultiSelectFilter
						label="Payment Method"
						placeholder="Select methods..."
						options={[
							{
								label: "Cash on Delivery",
								value: PaymentMethod.CashOnDelivery,
							},
							{ label: "Online", value: PaymentMethod.Online },
						]}
						value={filters.payment_method}
						onChange={(value) =>
							onFiltersChange({
								...filters,
								payment_method: value as PaymentMethod[],
							})
						}
					/>

					{/* Order Type Filter */}
					<MultiSelectFilter
						label="Order Type"
						placeholder="Select types..."
						options={[
							{ label: "Purchase", value: OrderType.Purchase },
							{ label: "Rental", value: OrderType.Rental },
						]}
						value={filters.order_type}
						onChange={(value) =>
							onFiltersChange({ ...filters, order_type: value as OrderType[] })
						}
					/>

					{/* Date Range Filter */}
					<div className="space-y-2 md:col-span-2">
						<label className="text-sm font-medium">Order Date Range</label>
						<DateRangeFilter
							dateRange={filters.dateRange}
							onChange={(range) =>
								onFiltersChange({ ...filters, dateRange: range })
							}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
