"use client";

import { useState } from "react";
import { SubscriptionTable } from "@/components/subscriptions/subscription-table";
import { SubscriptionHeader } from "@/components/subscriptions/subscription-header";
import { SubscriptionFilters } from "@/types/subscription-types";

export function SubscriptionDashboard() {
	const [filters, setFilters] = useState<SubscriptionFilters>({
		search: "",
		status: "all",
		payment_status: undefined,
		payment_method: undefined,
	});

	const handleFiltersChange = (newFilters: SubscriptionFilters) => {
		setFilters(newFilters);
	};

	return (
		<div className="flex flex-col space-y-6">
			<SubscriptionHeader
				filters={filters}
				onFiltersChange={handleFiltersChange}
			/>
			<SubscriptionTable filters={filters} />
		</div>
	);
}
