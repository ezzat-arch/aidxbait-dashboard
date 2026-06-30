import { Suspense } from "react";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { DateRange } from "@/types/analytics-types";
import { StoreTab } from "@/components/analytics/tabs/store-tab";
import { ProgramsTab } from "@/components/analytics/tabs/programs-tab";
import { EcommerceTab } from "@/components/analytics/tabs/ecommerce-tab";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { AnalyticsHeader } from "@/components/analytics/analytics-header";

interface AnalyticsPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ComingSoonTab = ({ title }: { title: string }) => {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center p-12">
				<div className="rounded-full bg-muted p-4 mb-4">
					<Construction className="w-8 h-8 text-muted-foreground" />
				</div>
				<h3 className="text-xl font-semibold mb-2">{title}</h3>
				<p className="text-muted-foreground text-center">
					This analytics section is coming soon. Check back later for insights
					and metrics.
				</p>
			</CardContent>
		</Card>
	);
};

const TabLoadingFallback = () => {
	return (
		<div className="grid gap-6 md:grid-cols-2">
			{[1, 2, 3, 4].map((i) => (
				<Card key={i} className="h-96 animate-pulse bg-muted" />
			))}
		</div>
	);
};

export default async function AnalyticsPage({
	searchParams,
}: AnalyticsPageProps) {
	// Await searchParams as per Next.js 15 requirement
	const params = await searchParams;

	// Parse date range from URL or default to last 30 days
	const from = params.from as string | undefined;
	const to = params.to as string | undefined;

	const dateRange: DateRange =
		from && to
			? {
					from: new Date(from),
					to: new Date(to),
			  }
			: {
					from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					to: new Date(),
			  };

	const activeTab = (params.tab as string) || "store";
	const collectionId = params.collection as string | undefined;
	const searchQuery = (params.q as string) || "";

	return (
		<PermissionGate permissions={[Permission.ViewAnalytics]}>
			<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
				{/* Header with client-side date filter */}
				<AnalyticsHeader initialDateRange={dateRange} initialTab={activeTab} />

				{/* Tab content - conditionally render based on active tab */}
				{activeTab === "store" && (
					<Suspense fallback={<TabLoadingFallback />}>
						<StoreTab
							dateRange={dateRange}
							searchQuery={searchQuery}
							collectionId={collectionId}
						/>
					</Suspense>
				)}

				{activeTab === "programs" && (
					<Suspense fallback={<TabLoadingFallback />}>
						<ProgramsTab
							dateRange={dateRange}
							searchQuery={searchQuery}
							collectionId={collectionId}
						/>
					</Suspense>
				)}

				{activeTab === "ecommerce" && (
					<Suspense fallback={<TabLoadingFallback />}>
						<EcommerceTab
							dateRange={dateRange}
							searchQuery={searchQuery}
							collectionId={collectionId}
						/>
					</Suspense>
				)}

				{activeTab === "home-visits" && (
					<ComingSoonTab title="Home Visits Analytics" />
				)}

				{activeTab === "consultations" && (
					<ComingSoonTab title="Online Consultations Analytics" />
				)}
			</div>
		</PermissionGate>
	);
}
