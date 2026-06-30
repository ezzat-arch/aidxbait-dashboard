"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	// Close the mobile drawer whenever the route changes (e.g. user taps a nav
	// item), so the overlay never lingers over the new page.
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	return (
		<div className="flex h-screen bg-background">
			{/* Desktop sidebar: part of the flex layout, hidden on mobile. */}
			<div className="hidden md:flex">
				<DashboardSidebar variant="desktop" />
			</div>

			{/* Mobile drawer sidebar. */}
			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
				<SheetContent
					side="left"
					className="w-72 max-w-[85vw] p-0 sm:max-w-[18rem]"
				>
					<SheetTitle className="sr-only">Navigation</SheetTitle>
					<DashboardSidebar
						variant="mobile"
						onNavigate={() => setMobileOpen(false)}
					/>
				</SheetContent>
			</Sheet>

			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Mobile top bar with the hamburger toggle. Hidden on desktop where
				    the sidebar is always present. */}
				<header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileOpen(true)}
						aria-label="Open navigation menu"
					>
						<Menu className="h-5 w-5" />
					</Button>
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
							A
						</div>
						<span className="text-lg font-bold">AidXBait</span>
					</div>
				</header>

				<main className="flex-1 overflow-auto">{children}</main>
			</div>
		</div>
	);
}
