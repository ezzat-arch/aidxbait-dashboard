"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	ChevronLeft,
	ChevronRight,
	LogOut,
	Settings,
	Users,
	BarChart3,
	ShoppingBag,
	Dumbbell,
	CalendarDays,
	ShoppingCart,
	PackageSearch,
	Stethoscope,
	MapPin,
	Tag,
	Newspaper,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/providers/user-provider";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { cn } from "@/lib/utils";

const navItems = [
	{
		title: "Users",
		href: "/dashboard/users",
		icon: Users,
		permission: Permission.ViewUsers,
		disabled: false,
	},
	{
		title: "Therapists",
		href: "/dashboard/therapists",
		icon: Stethoscope,
		permission: Permission.ViewTherapists,
		disabled: false,
	},
	{
		title: "Service Areas",
		href: "/dashboard/locations",
		icon: MapPin,
		permission: Permission.ViewLocations,
		disabled: false,
	},
	{
		title: "Specialties",
		href: "/dashboard/specialties",
		icon: Tag,
		permission: Permission.ViewSpecialties,
		disabled: false,
	},
	{
		title: "Exercise Programs",
		href: "/dashboard/exercise-programs",
		icon: Dumbbell,
		permission: Permission.ViewExercisePrograms,
		disabled: false,
	},
	{
		title: "Program Subscriptions",
		href: "/dashboard/program-subscription",
		icon: CalendarDays,
		permission: Permission.ViewSubscriptions,
		disabled: false,
	},
	{
		title: "Store",
		href: "/dashboard/store",
		icon: ShoppingBag,
		permission: Permission.ViewStore,
		disabled: false,
	},
	{
		title: "Blog",
		href: "/dashboard/blogs",
		icon: Newspaper,
		permission: Permission.ViewBlogs,
		disabled: false,
	},
	{
		title: "Orders",
		href: "/dashboard/orders",
		icon: ShoppingCart,
		permission: Permission.ViewOrders,
		disabled: false,
	},
	{
		title: "Shopify Orders",
		href: "/dashboard/shopify-orders",
		icon: PackageSearch,
		permission: Permission.ViewOrders,
		disabled: false,
	},
	{
		title: "Analytics",
		href: "/dashboard/analytics",
		icon: BarChart3,
		permission: Permission.ViewAnalytics,
		disabled: false,
	},
	{
		title: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
		permission: Permission.ViewSettings,
		disabled: true,
	},
];

interface DashboardSidebarProps {
	/**
	 * When true the sidebar renders in its mobile (drawer) form: always
	 * expanded, no desktop collapse toggle. Defaults to the desktop form.
	 */
	variant?: "desktop" | "mobile";
	/**
	 * Called when a nav link is activated. Used by the mobile drawer to close
	 * itself after navigation.
	 */
	onNavigate?: () => void;
}

export function DashboardSidebar({
	variant = "desktop",
	onNavigate,
}: DashboardSidebarProps) {
	const isMobile = variant === "mobile";
	// On mobile the drawer is always fully expanded; only desktop collapses.
	const [collapsed, setCollapsed] = useState(false);
	const showLabels = isMobile || !collapsed;

	const pathname = usePathname();
	const router = useRouter();
	const { toast } = useToast();
	const { user, rbacUser } = useUserContext();

	const supabase = createClient();

	async function handleLogout() {
		try {
			await supabase.auth.signOut();
			toast({
				title: "Logged out",
				description: "You have been logged out successfully",
			});
			onNavigate?.();
			router.push("/login");
			router.refresh();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to log out",
			});
		}
	}

	return (
		<div
			className={cn(
				"flex flex-col h-full bg-card transition-all duration-300",
				// On mobile the drawer provides its own border/width; on desktop we
				// keep the resizable column with a right border.
				isMobile
					? "w-full border-r-0"
					: cn("border-r border-border", collapsed ? "w-20" : "w-64")
			)}
		>
			<div className="flex items-center justify-between p-4">
				<div
					className={cn(
						"flex items-center",
						!showLabels && "justify-center w-full"
					)}
				>
					<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
						A
					</div>
					{showLabels && (
						<span className="ml-2 font-bold text-lg">AidXBait</span>
					)}
				</div>
				{/* The collapse toggle is desktop-only; the drawer is dismissed via its
				    overlay / close button instead. */}
				{!isMobile && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setCollapsed(!collapsed)}
						className={collapsed ? "mx-auto" : ""}
					>
						{collapsed ? (
							<ChevronRight size={18} />
						) : (
							<ChevronLeft size={18} />
						)}
					</Button>
				)}
			</div>

			<Separator />

			<div className="flex-1 overflow-y-auto py-4">
				<nav className="space-y-1 px-2">
					{navItems.map((item) => (
						<PermissionGate key={item.href} permissions={[item.permission]}>
							{item.disabled ? (
								<div
									className={cn(
										"flex items-center px-3 py-2 rounded-md transition-colors",
										"text-muted-foreground/50 cursor-not-allowed opacity-50"
									)}
								>
									<item.icon size={20} className="shrink-0" />
									{showLabels && <span className="ml-3">{item.title}</span>}
								</div>
							) : (
								<Link
									href={item.href}
									onClick={() => onNavigate?.()}
									className={cn(
										"flex items-center px-3 py-2 rounded-md transition-colors",
										pathname === item.href
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									)}
								>
									<item.icon size={20} className="shrink-0" />
									{showLabels && <span className="ml-3">{item.title}</span>}
								</Link>
							)}
						</PermissionGate>
					))}
				</nav>
			</div>

			<Separator />

			<div className="p-4">
				<div
					className={cn("flex items-center", !showLabels && "flex-col")}
				>
					<Avatar className="h-10 w-10 shrink-0">
						<AvatarImage src="/placeholder.svg" alt={user?.email || "User"} />
						<AvatarFallback>
							{user?.email?.charAt(0).toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>
					{showLabels && (
						<div className="ml-3 overflow-hidden">
							<p className="text-sm font-medium truncate">{user?.email}</p>
							<p className="text-xs text-muted-foreground truncate">
								{rbacUser?.roles
									.map((role) => role.charAt(0).toUpperCase() + role.slice(1))
									.join(", ") || "Guest"}
							</p>
						</div>
					)}
				</div>

				<Button
					variant="ghost"
					size={showLabels ? "default" : "icon"}
					className={cn("w-full mt-4", !showLabels && "h-10")}
					onClick={handleLogout}
				>
					<LogOut size={20} className="shrink-0" />
					{showLabels && <span className="ml-2">Logout</span>}
				</Button>
			</div>
		</div>
	);
}
