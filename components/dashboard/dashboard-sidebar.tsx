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
	Shield,
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

export function DashboardSidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	const { toast } = useToast();
	const { user, clearUser, rbacUser } = useUserContext();

	const supabase = createClient();

	const navItems = [
		{
			title: "Users",
			href: "/dashboard/users",
			icon: Users,
			permission: Permission.ViewUsers,
		},
		{
			title: "Analytics",
			href: "/dashboard/analytics",
			icon: BarChart3,
			permission: Permission.ViewAnalytics,
		},
		{
			title: "Settings",
			href: "/dashboard/settings",
			icon: Settings,
			permission: Permission.ViewSettings,
		},
		{
			title: "Admin",
			href: "/dashboard/admin",
			icon: Shield,
			permission: Permission.ManageRoles,
		},
	];

	async function handleLogout() {
		try {
			await supabase.auth.signOut();
			clearUser();
			toast({
				title: "Logged out",
				description: "You have been logged out successfully",
			});
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
				"flex flex-col h-full bg-card border-r border-border transition-all duration-300",
				collapsed ? "w-20" : "w-64"
			)}
		>
			<div className="flex items-center justify-between p-4">
				<div
					className={cn(
						"flex items-center",
						collapsed && "justify-center w-full"
					)}
				>
					<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
						A
					</div>
					{!collapsed && (
						<span className="ml-2 font-bold text-lg">AidXBait</span>
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCollapsed(!collapsed)}
					className={collapsed ? "mx-auto" : ""}
				>
					{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
				</Button>
			</div>

			<Separator />

			<div className="flex-1 py-4">
				<nav className="space-y-1 px-2">
					{navItems.map((item) => (
						<PermissionGate key={item.href} permissions={[item.permission]}>
							<Link
								href={item.href}
								className={cn(
									"flex items-center px-3 py-2 rounded-md transition-colors",
									pathname === item.href
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								<item.icon size={20} />
								{!collapsed && <span className="ml-3">{item.title}</span>}
							</Link>
						</PermissionGate>
					))}
				</nav>
			</div>

			<Separator />

			<div className="p-4">
				<div className={cn("flex items-center", collapsed && "flex-col")}>
					<Avatar className="h-10 w-10">
						<AvatarImage src="/placeholder.svg" alt={user?.email || "User"} />
						<AvatarFallback>
							{user?.email?.charAt(0).toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>
					{!collapsed && (
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
					size={collapsed ? "icon" : "default"}
					className={cn("w-full mt-4", collapsed && "h-10")}
					onClick={handleLogout}
				>
					<LogOut size={20} />
					{!collapsed && <span className="ml-2">Logout</span>}
				</Button>
			</div>
		</div>
	);
}
