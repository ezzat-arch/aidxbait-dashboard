import { SpecialtiesTable } from "@/components/specialties/specialties-table";

export default function SpecialtiesPage() {
	return (
		<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Specialties</h1>
					<p className="text-sm text-muted-foreground">
						Manage the specialties therapists can choose at signup and patients
						can filter by when booking a home visit.
					</p>
				</div>
			</div>
			<SpecialtiesTable />
		</div>
	);
}
