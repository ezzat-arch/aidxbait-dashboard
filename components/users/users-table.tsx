"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	MoreHorizontal,
	Edit,
	Trash2,
	Eye,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { SortConfig, sortData, toggleSort } from "@/lib/table-sort";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useUsersFilter } from "@/hooks/use-users-filter";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { UserFormSheet } from "@/components/users/user-form-sheet";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { UserDetailsSheet } from "@/components/users/user-details-sheet";
import type { UserData } from "@/types/user-types";

export function UsersTable() {
	const [users, setUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalUsers, setTotalUsers] = useState(0);
	const itemsPerPage = 10;

	// Edit sheet state
	const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
	const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

	// Delete dialog state
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Details sheet state
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

	const { searchQuery, statusFilter, selectedRoles } = useUsersFilter();
	const { toast } = useToast();
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		column: null,
		direction: null,
	});

	const sortedUsers = useMemo(
		() =>
			sortData(users, sortConfig, {
				name: (item) =>
					[item.first_name, item.last_name].filter(Boolean).join(" ") ||
					"No name",
				role: (item) => item.user_type,
				date: (item) => new Date(item.created_at).getTime(),
			}),
		[users, sortConfig]
	);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Build query parameters
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
			});

			if (searchQuery) {
				params.append("search", searchQuery);
			}

			if (selectedRoles.length > 0) {
				params.append("roles", selectedRoles.join(","));
			}

			const response = await fetch(`/api/protected/users?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`Error fetching users: ${response.statusText}`);
			}

			const result = await response.json();
			setUsers(result.data);
			setTotalPages(result.meta.totalPages);
			setTotalUsers(result.meta.total);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while fetching users"
			);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to load users",
			});
		} finally {
			setLoading(false);
		}
	}, [page, searchQuery, selectedRoles, toast]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	const handleViewDetailsClick = (user: UserData) => {
		setSelectedUser(user);
		setIsDetailsSheetOpen(true);
	};

	const handleEditClick = (user: UserData) => {
		setSelectedUser(user);
		setIsEditSheetOpen(true);
	};

	const handleDeleteClick = (user: UserData) => {
		setSelectedUser(user);
		setIsDeleteDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchUsers();
	};

	const handleDeleteSuccess = () => {
		fetchUsers();
	};

	return (
		<>
			<div className="flex flex-col space-y-4 bg-card rounded-lg border border-border">
				<div className="rounded-md">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead
									className="cursor-pointer select-none hover:bg-muted/50"
									onClick={() => setSortConfig(toggleSort(sortConfig, "name"))}
								>
									<div className="flex items-center gap-1">
										User
										{sortConfig.column === "name" ? (
											sortConfig.direction === "asc" ? (
												<ArrowUp className="h-4 w-4" />
											) : (
												<ArrowDown className="h-4 w-4" />
											)
										) : (
											<ArrowUpDown className="h-4 w-4 opacity-50" />
										)}
									</div>
								</TableHead>
								<TableHead
									className="cursor-pointer select-none hover:bg-muted/50"
									onClick={() => setSortConfig(toggleSort(sortConfig, "role"))}
								>
									<div className="flex items-center gap-1">
										Role
										{sortConfig.column === "role" ? (
											sortConfig.direction === "asc" ? (
												<ArrowUp className="h-4 w-4" />
											) : (
												<ArrowDown className="h-4 w-4" />
											)
										) : (
											<ArrowUpDown className="h-4 w-4 opacity-50" />
										)}
									</div>
								</TableHead>
								<TableHead>Status</TableHead>
								<TableHead
									className="cursor-pointer select-none hover:bg-muted/50"
									onClick={() => setSortConfig(toggleSort(sortConfig, "date"))}
								>
									<div className="flex items-center gap-1">
										Last Active
										{sortConfig.column === "date" ? (
											sortConfig.direction === "asc" ? (
												<ArrowUp className="h-4 w-4" />
											) : (
												<ArrowDown className="h-4 w-4" />
											)
										) : (
											<ArrowUpDown className="h-4 w-4 opacity-50" />
										)}
									</div>
								</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								// Loading state
								Array.from({ length: itemsPerPage }).map((_, index) => (
									<TableRow key={`loading-${index}`}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
												<div className="space-y-2">
													<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
													<div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
										</TableCell>
										<TableCell>
											<div className="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
										</TableCell>
										<TableCell>
											<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
										</TableCell>
										<TableCell>
											<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
										</TableCell>
									</TableRow>
								))
							) : error ? (
								// Error state
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-8 text-destructive"
									>
										{error}
									</TableCell>
								</TableRow>
							) : sortedUsers.length > 0 ? (
								// Data state
								sortedUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src="/placeholder.svg"
														alt={user.first_name || "User"}
													/>
													<AvatarFallback>
														{user.first_name?.charAt(0) ||
															user.last_name?.charAt(0) ||
															"U"}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">
														{[user.first_name, user.last_name]
															.filter(Boolean)
															.join(" ") || "No name"}
													</div>
													<div className="text-sm text-muted-foreground">
														{user.email || "No email"}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="capitalize">{user.user_type}</div>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className="bg-green-500/20 text-green-500 hover:bg-green-500/30"
											>
												Active
											</Badge>
										</TableCell>
										<TableCell>{formatDate(user.created_at)}</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">Open menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<PermissionGate permissions={[Permission.ViewUsers]}>
														<DropdownMenuItem
															onClick={() => handleViewDetailsClick(user)}
														>
															<Eye className="mr-2 h-4 w-4" />
															View details
														</DropdownMenuItem>
													</PermissionGate>

													<PermissionGate
														permissions={[Permission.UpdateUsers]}
													>
														<DropdownMenuItem
															onClick={() => handleEditClick(user)}
														>
															<Edit className="mr-2 h-4 w-4" />
															Edit user
														</DropdownMenuItem>
													</PermissionGate>

													<PermissionGate
														permissions={[Permission.DeleteUsers]}
													>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => handleDeleteClick(user)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete user
														</DropdownMenuItem>
													</PermissionGate>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								// Empty state
								<TableRow>
									<TableCell colSpan={5} className="text-center py-8">
										No users found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{!loading && !error && users.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-sm text-muted-foreground">
							Showing {Math.min(totalUsers, (page - 1) * itemsPerPage + 1)} to{" "}
							{Math.min(totalUsers, page * itemsPerPage)} of {totalUsers} users
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page - 1)}
								disabled={page === 1}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page + 1)}
								disabled={page === totalPages}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Edit User Sheet */}
			<UserFormSheet
				open={isEditSheetOpen}
				onOpenChange={setIsEditSheetOpen}
				user={selectedUser}
				onSuccess={handleEditSuccess}
			/>

			{/* Delete User Dialog */}
			<DeleteUserDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				user={selectedUser}
				onSuccess={handleDeleteSuccess}
			/>

			{/* User Details Sheet */}
			<UserDetailsSheet
				open={isDetailsSheetOpen}
				onOpenChange={setIsDetailsSheetOpen}
				user={selectedUser}
			/>
		</>
	);
}
