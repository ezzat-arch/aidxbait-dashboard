"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "@/types/analytics-types";
import { DateRangeFilter } from "./date-range-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AnalyticsHeaderProps {
	initialDateRange: DateRange;
	initialTab: string;
}

export const AnalyticsHeader = ({
	initialDateRange,
	initialTab,
}: AnalyticsHeaderProps) => {
	const router = useRouter();
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Helper to format date as YYYY-MM-DD using local timezone
	const formatDateForUrl = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// Update URL when date range changes
	const handleDateRangeChange = (newRange: DateRange) => {
		const params = new URLSearchParams(window.location.search);

		if (newRange.from && newRange.to) {
			params.set("from", formatDateForUrl(newRange.from));
			params.set("to", formatDateForUrl(newRange.to));
		} else {
			params.delete("from");
			params.delete("to");
		}

		router.push(`/dashboard/analytics?${params.toString()}`);
	};

	// Update URL when tab changes
	const handleTabChange = (tab: string) => {
		const params = new URLSearchParams(window.location.search);
		params.set("tab", tab);
		router.push(`/dashboard/analytics?${params.toString()}`);
	};

	// Refresh all analytics data by re-running server components
	const handleRefresh = async () => {
		setIsRefreshing(true);
		router.refresh();
		// Small delay to show the animation
		setTimeout(() => {
			setIsRefreshing(false);
		}, 500);
	};

	return (
		<>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Analytics Dashboard</h1>
					<p className="text-muted-foreground">
						View insights and metrics across your platform
					</p>
				</div>
				<DateRangeFilter
					dateRange={initialDateRange}
					onChange={handleDateRangeChange}
				/>
			</div>

			{/* Tabs with Refresh Button */}
			<div className="flex items-center gap-4">
				<Tabs
					value={initialTab}
					onValueChange={handleTabChange}
					className="flex-1"
				>
					<TabsList className="grid w-full grid-cols-5 lg:w-[700px]">
						<TabsTrigger value="store">Store</TabsTrigger>
						<TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
						<TabsTrigger value="programs">Programs</TabsTrigger>
						<TabsTrigger value="home-visits">Home Visits</TabsTrigger>
						<TabsTrigger value="consultations">Consults</TabsTrigger>
					</TabsList>
				</Tabs>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="shrink-0"
					aria-label="Refresh analytics data"
				>
					<RefreshCw
						className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
					/>
				</Button>
			</div>
		</>
	);
};
