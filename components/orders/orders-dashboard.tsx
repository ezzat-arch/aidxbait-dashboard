"use client";

import { useState } from "react";
import { OrdersHeader } from "./orders-header";
import { OrdersTable } from "./orders-table";
import { OrderFilters } from "@/types/order-types";

export function OrdersDashboard() {
	const [filters, setFilters] = useState<OrderFilters>({
		search: "",
		order_status: [],
		payment_status: [],
		payment_method: [],
		order_type: [],
		dateRange: { from: null, to: null },
	});

	const handleFiltersChange = (newFilters: OrderFilters) => {
		setFilters(newFilters);
	};

	return (
		<div className="flex flex-col space-y-6">
			<OrdersHeader filters={filters} onFiltersChange={handleFiltersChange} />
			<OrdersTable filters={filters} />
		</div>
	);
}
