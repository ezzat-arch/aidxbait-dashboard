"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter } from "lucide-react";
import {
	SubscriptionFilters,
	PaymentStatus,
	PaymentMethod,
} from "@/types/subscription-types";
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";

interface SubscriptionHeaderProps {
	filters: SubscriptionFilters;
	onFiltersChange: (filters: SubscriptionFilters) => void;
}

export function SubscriptionHeader({
	filters,
	onFiltersChange,
}: SubscriptionHeaderProps) {
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const handleSearchChange = (value: string) => {
		onFiltersChange({ ...filters, search: value });
	};

	const handleStatusChange = (value: string) => {
		onFiltersChange({
			...filters,
			status: value as "active" | "cancelled" | "all",
		});
	};

	const handlePaymentStatusChange = (value: string) => {
		onFiltersChange({
			...filters,
			payment_status: value === "all" ? undefined : (value as PaymentStatus),
		});
	};

	const handlePaymentMethodChange = (value: string) => {
		onFiltersChange({
			...filters,
			payment_method: value === "all" ? undefined : (value as PaymentMethod),
		});
	};

	const clearFilters = () => {
		onFiltersChange({
			search: "",
			status: "all",
			payment_status: undefined,
			payment_method: undefined,
		});
	};

	const activeFiltersCount = [
		filters.search,
		filters.status !== "all" ? filters.status : null,
		filters.payment_status,
		filters.payment_method,
	].filter(Boolean).length;

	return (
		<>
			<div className="flex flex-col space-y-4">
				{/* Header Row */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search patients, programs..."
								value={filters.search || ""}
								onChange={(e) => handleSearchChange(e.target.value)}
								className="pl-10 w-80"
							/>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilters(!showFilters)}
							className="relative"
						>
							<Filter className="h-4 w-4 mr-2" />
							Filters
							{activeFiltersCount > 0 && (
								<Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
									{activeFiltersCount}
								</Badge>
							)}
						</Button>
						{activeFiltersCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="text-muted-foreground"
							>
								Clear filters
							</Button>
						)}
					</div>

					<PermissionGate permissions={[Permission.CreateSubscriptions]}>
						<Button onClick={() => setShowCreateDialog(true)}>
							<Plus className="h-4 w-4 mr-2" />
							New Subscription
						</Button>
					</PermissionGate>
				</div>

				{/* Filters Panel */}
				{showFilters && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Filters</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">Status</label>
									<Select
										value={filters.status}
										onValueChange={handleStatusChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Subscriptions</SelectItem>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Payment Status</label>
									<Select
										value={filters.payment_status || "all"}
										onValueChange={handlePaymentStatusChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select payment status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Payment Status</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
											<SelectItem value="failed">Failed</SelectItem>
											<SelectItem value="refunded">Refunded</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Payment Method</label>
									<Select
										value={filters.payment_method || "all"}
										onValueChange={handlePaymentMethodChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select payment method" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Payment Methods</SelectItem>
											<SelectItem value="card">Card</SelectItem>
											<SelectItem value="instapay">Instapay</SelectItem>
											<SelectItem value="cash">Cash</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			<SubscriptionFormDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSuccess={() => {
					setShowCreateDialog(false);
					// Refresh table data will be handled by the table component
				}}
			/>
		</>
	);
}
