import type React from "react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<div className="flex h-screen bg-background">
			<DashboardSidebar />
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
