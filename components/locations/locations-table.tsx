"use client";

import { useState, useEffect, useCallback } from "react";
import {
	MoreHorizontal,
	Edit,
	Trash2,
	Search,
	Plus,
	MapPin,
	Users,
	Inbox,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { DeleteLocationDialog } from "@/components/locations/delete-location-dialog";
import type { LocationRow } from "@/types/location-types";

export function LocationsTable() {
	const [locations, setLocations] = useState<LocationRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const itemsPerPage = 10;

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");

	const [selected, setSelected] = useState<LocationRow | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const { toast } = useToast();

	const fetchLocations = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
			});
			if (search) params.append("search", search);

			const res = await fetch(`/api/protected/locations?${params.toString()}`);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || `Error: ${res.statusText}`);
			}
			const result = await res.json();
			setLocations(result.data);
			setTotalPages(result.meta.totalPages);
			setTotal(result.meta.total);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load service areas";
			setError(message);
			toast({ variant: "destructive", title: "Error", description: message });
		} finally {
			setLoading(false);
		}
	}, [page, search, toast]);

	useEffect(() => {
		fetchLocations();
	}, [fetchLocations]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		setSearch(searchInput);
	};

	const openCreate = () => {
		setSelected(null);
		setFormOpen(true);
	};
	const openEdit = (location: LocationRow) => {
		setSelected(location);
		setFormOpen(true);
	};
	const openDelete = (location: LocationRow) => {
		setSelected(location);
		setDeleteOpen(true);
	};

	return (
		<>
			{/* Toolbar */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
				<form onSubmit={handleSearch} className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search service areas..."
							className="pl-10"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</form>
				<PermissionGate permissions={[Permission.CreateLocations]}>
					<Button onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add Area
					</Button>
				</PermissionGate>
			</div>

			<div className="flex flex-col space-y-4 bg-card rounded-lg border border-border">
				<div className="rounded-md">
					<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Area</TableHead>
								<TableHead>Coordinates</TableHead>
								<TableHead>Map span</TableHead>
								<TableHead>Therapists</TableHead>
								<TableHead>Requests</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`loading-${i}`}>
										{Array.from({ length: 6 }).map((__, j) => (
											<TableCell key={j}>
												<div className="h-4 w-20 bg-muted animate-pulse rounded" />
											</TableCell>
										))}
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8 text-destructive"
									>
										{error}
									</TableCell>
								</TableRow>
							) : locations.length > 0 ? (
								locations.map((location) => (
									<TableRow key={location.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">
													{location.location_name}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground font-mono">
												{location.latitude.toFixed(4)},{" "}
												{location.longitude.toFixed(4)}
											</span>
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground font-mono">
												±{location.latitude_delta} / ±{location.longitude_delta}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={
													location.therapist_count > 0
														? "bg-green-500/20 text-green-600"
														: "bg-zinc-500/10 text-muted-foreground"
												}
											>
												<Users className="mr-1 h-3 w-3" />
												{location.therapist_count}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className="bg-blue-500/10 text-blue-600"
											>
												<Inbox className="mr-1 h-3 w-3" />
												{location.request_count}
											</Badge>
										</TableCell>
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
													<PermissionGate
														permissions={[Permission.UpdateLocations]}
													>
														<DropdownMenuItem onClick={() => openEdit(location)}>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
													</PermissionGate>
													<PermissionGate
														permissions={[Permission.DeleteLocations]}
													>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => openDelete(location)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</PermissionGate>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8">
										No service areas found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
					</div>
				</div>

				{!loading && !error && locations.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-sm text-muted-foreground">
							Showing {Math.min(total, (page - 1) * itemsPerPage + 1)} to{" "}
							{Math.min(total, page * itemsPerPage)} of {total} areas
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

			<LocationFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				location={selected}
				onSuccess={fetchLocations}
			/>

			<DeleteLocationDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				location={selected}
				onSuccess={fetchLocations}
			/>
		</>
	);
}
