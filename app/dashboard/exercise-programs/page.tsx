"use client";

import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { ExerciseProgramsDashboard } from "@/components/exercise-programs/exercise-programs-dashboard";

export default function ExerciseProgramsPage() {
	return (
		<PermissionGate permissions={[Permission.ViewExercisePrograms]}>
			<div className="flex flex-col h-full p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Exercise Programs</h1>
						<p className="text-muted-foreground">
							Manage exercise programs and video content for AidXBait training
							platform
						</p>
					</div>
				</div>
				<ExerciseProgramsDashboard />
			</div>
		</PermissionGate>
	);
}
