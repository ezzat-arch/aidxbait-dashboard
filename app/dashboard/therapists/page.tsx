import { TherapistsTable } from "@/components/therapists/therapists-table";

export default function TherapistsPage() {
	return (
		<div className="flex flex-col h-full p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Therapists</h1>
					<p className="text-sm text-muted-foreground">
						Review therapist applications, inspect documents, and approve or
						decline access.
					</p>
				</div>
			</div>
			<TherapistsTable />
		</div>
	);
}
