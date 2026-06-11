import { LocationsTable } from "@/components/locations/locations-table";

export default function LocationsPage() {
	return (
		<div className="flex flex-col h-full p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Service Areas</h1>
					<p className="text-sm text-muted-foreground">
						Manage the areas where home visits are offered. Therapists pick
						their coverage and patients book requests from this list.
					</p>
				</div>
			</div>
			<LocationsTable />
		</div>
	);
}
