"use client";

import { useState, useEffect, useCallback } from "react";
import {
	MoreHorizontal,
	Edit,
	Trash2,
	Search,
	Plus,
	Tag,
	Users,
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
import { SpecialtyFormDialog } from "@/components/specialties/specialty-form-dialog";
import { DeleteSpecialtyDialog } from "@/components/specialties/delete-specialty-dialog";
import type { SpecialtyRow } from "@/types/specialty-types";

export function SpecialtiesTable() {
	const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const itemsPerPage = 10;

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");

	const [selected, setSelected] = useState<SpecialtyRow | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const { toast } = useToast();

	const fetchSpecialties = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
			});
			if (search) params.append("search", search);

			const res = await fetch(`/api/protected/specialties?${params.toString()}`);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || `Error: ${res.statusText}`);
			}
			const result = await res.json();
			setSpecialties(result.data);
			setTotalPages(result.meta.totalPages);
			setTotal(result.meta.total);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load specialties";
			setError(message);
			toast({ variant: "destructive", title: "Error", description: message });
		} finally {
			setLoading(false);
		}
	}, [page, search, toast]);

	useEffect(() => {
		fetchSpecialties();
	}, [fetchSpecialties]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		setSearch(searchInput);
	};

	const openCreate = () => {
		setSelected(null);
		setFormOpen(true);
	};
	const openEdit = (specialty: SpecialtyRow) => {
		setSelected(specialty);
		setFormOpen(true);
	};
	const openDelete = (specialty: SpecialtyRow) => {
		setSelected(specialty);
		setDeleteOpen(true);
	};

	return (
		<>
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
				<form onSubmit={handleSearch} className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search specialties..."
							className="pl-10"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</form>
				<PermissionGate permissions={[Permission.CreateSpecialties]}>
					<Button onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add Specialty
					</Button>
				</PermissionGate>
			</div>

			<div className="flex flex-col space-y-4 bg-card rounded-lg border border-border">
				<div className="rounded-md">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Arabic name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Therapists</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`loading-${i}`}>
										{Array.from({ length: 5 }).map((__, j) => (
											<TableCell key={j}>
												<div className="h-4 w-24 bg-muted animate-pulse rounded" />
											</TableCell>
										))}
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-8 text-destructive"
									>
										{error}
									</TableCell>
								</TableRow>
							) : specialties.length > 0 ? (
								specialties.map((specialty) => (
									<TableRow key={specialty.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Tag className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">{specialty.name}</span>
											</div>
										</TableCell>
										<TableCell>
											<span
												className="text-sm text-muted-foreground"
												dir="rtl"
											>
												{specialty.name_ar || "—"}
											</span>
										</TableCell>
										<TableCell>
											{specialty.is_active ? (
												<Badge
													variant="outline"
													className="bg-green-500/20 text-green-600"
												>
													Active
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="bg-zinc-500/10 text-muted-foreground"
												>
													Inactive
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={
													specialty.therapist_count > 0
														? "bg-blue-500/10 text-blue-600"
														: "bg-zinc-500/10 text-muted-foreground"
												}
											>
												<Users className="mr-1 h-3 w-3" />
												{specialty.therapist_count}
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
														permissions={[Permission.UpdateSpecialties]}
													>
														<DropdownMenuItem
															onClick={() => openEdit(specialty)}
														>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
													</PermissionGate>
													<PermissionGate
														permissions={[Permission.DeleteSpecialties]}
													>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => openDelete(specialty)}
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
									<TableCell colSpan={5} className="text-center py-8">
										No specialties found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{!loading && !error && specialties.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-sm text-muted-foreground">
							Showing {Math.min(total, (page - 1) * itemsPerPage + 1)} to{" "}
							{Math.min(total, page * itemsPerPage)} of {total} specialties
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

			<SpecialtyFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				specialty={selected}
				onSuccess={fetchSpecialties}
			/>

			<DeleteSpecialtyDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				specialty={selected}
				onSuccess={fetchSpecialties}
			/>
		</>
	);
}
