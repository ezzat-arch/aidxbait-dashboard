"use client";

import type React from "react";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUsersFilter } from "@/hooks/use-users-filter";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";

export function UsersHeader() {
	const {
		searchQuery,
		setSearchQuery,
		statusFilter,
		setStatusFilter,
		selectedRoles,
		toggleRole,
	} = useUsersFilter();

	const [searchInput, setSearchInput] = useState(searchQuery);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchQuery(searchInput);
	};

	return (
		<div className="flex flex-col space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Users</h1>

				<PermissionGate permissions={[Permission.CreateUsers]}>
					<Button asChild>
						<Link href="/dashboard/users/create">
							<Plus className="mr-2 h-4 w-4" />
							Add User
						</Link>
					</Button>
				</PermissionGate>
			</div>

			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
				<form onSubmit={handleSearch} className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search users..."
							className="pl-10"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</form>

				<div className="flex items-center space-x-4">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
						</SelectContent>
					</Select>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">Roles</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56">
							<DropdownMenuLabel>Filter by role</DropdownMenuLabel>
							<DropdownMenuSeparator />
                                                        <DropdownMenuCheckboxItem
                                                                checked={selectedRoles.includes("superuser")}
                                                                onCheckedChange={() => toggleRole("superuser")}
                                                        >
                                                                Superuser
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                                checked={selectedRoles.includes("admin")}
                                                                onCheckedChange={() => toggleRole("admin")}
                                                        >
                                                                Admin
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                                checked={selectedRoles.includes("therapist")}
                                                                onCheckedChange={() => toggleRole("therapist")}
                                                        >
                                                                Therapist
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                                checked={selectedRoles.includes("consultant")}
                                                                onCheckedChange={() => toggleRole("consultant")}
                                                        >
                                                                Consultant
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                                checked={selectedRoles.includes("patient")}
                                                                onCheckedChange={() => toggleRole("patient")}
                                                        >
                                                                Patient
                                                        </DropdownMenuCheckboxItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
