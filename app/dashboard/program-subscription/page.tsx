"use client";

import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { SubscriptionDashboard } from "@/components/subscriptions/subscription-dashboard";

export default function ProgramSubscriptionPage() {
	return (
		<PermissionGate permissions={[Permission.ViewSubscriptions]}>
			<div className="flex flex-col h-full p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Program Subscriptions</h1>
						<p className="text-muted-foreground">
							Manage exercise program subscriptions, payments, and cancellations
						</p>
					</div>
				</div>
				<SubscriptionDashboard />
			</div>
		</PermissionGate>
	);
}
