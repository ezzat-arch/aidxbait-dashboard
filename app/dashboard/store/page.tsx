"use client";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { StoreDashboard } from "@/components/store/store-dashboard";

export default function StorePage() {
	return (
		<PermissionGate permissions={[Permission.ViewStore]}>
			<div className="flex flex-col h-full p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Store Management</h1>
						<p className="text-muted-foreground">
							Manage products, categories, joints, and reviews for AidXBait
							Online Store
						</p>
					</div>
				</div>
				<StoreDashboard />
			</div>
		</PermissionGate>
	);
}
