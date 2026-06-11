"use client";

import { useState, useEffect, useCallback } from "react";
import {
	MoreHorizontal,
	Eye,
	CheckCircle2,
	XCircle,
	Search,
	FileText,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { TherapistDetailsSheet } from "@/components/therapists/therapist-details-sheet";
import { DeclineTherapistDialog } from "@/components/therapists/decline-therapist-dialog";
import { ApproveTherapistDialog } from "@/components/therapists/approve-therapist-dialog";
import type { TherapistRow } from "@/types/therapist-types";
import {
	STATUS_LABELS,
	STATUS_BADGE_CLASS,
} from "@/types/therapist-types";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "pending_review", label: "Pending review" },
	{ value: "pending_documents", label: "Pending documents" },
	{ value: "approved", label: "Approved" },
	{ value: "rejected", label: "Rejected" },
	{ value: "suspended", label: "Suspended" },
];

export function TherapistsTable() {
	const [therapists, setTherapists] = useState<TherapistRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const itemsPerPage = 10;

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");

	const [selected, setSelected] = useState<TherapistRow | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [approveOpen, setApproveOpen] = useState(false);
	const [declineOpen, setDeclineOpen] = useState(false);

	const { toast } = useToast();

	const fetchTherapists = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
			});
			if (search) params.append("search", search);
			if (status !== "all") params.append("status", status);

			const res = await fetch(`/api/protected/therapists?${params.toString()}`);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || `Error: ${res.statusText}`);
			}
			const result = await res.json();
			setTherapists(result.data);
			setTotalPages(result.meta.totalPages);
			setTotal(result.meta.total);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load therapists";
			setError(message);
			toast({ variant: "destructive", title: "Error", description: message });
		} finally {
			setLoading(false);
		}
	}, [page, search, status, toast]);

	useEffect(() => {
		fetchTherapists();
	}, [fetchTherapists]);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		setSearch(searchInput);
	};

	const openDetails = (t: TherapistRow) => {
		setSelected(t);
		setDetailsOpen(true);
	};
	const openApprove = (t: TherapistRow) => {
		setSelected(t);
		setApproveOpen(true);
	};
	const openDecline = (t: TherapistRow) => {
		setSelected(t);
		setDeclineOpen(true);
	};

	return (
		<>
			{/* Filters */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
				<form onSubmit={handleSearch} className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by name, email, phone, specialty..."
							className="pl-10"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</form>
				<Select
					value={status}
					onValueChange={(v) => {
						setPage(1);
						setStatus(v);
					}}
				>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						{STATUS_OPTIONS.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col space-y-4 bg-card rounded-lg border border-border">
				<div className="rounded-md">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Therapist</TableHead>
								<TableHead>Specialty</TableHead>
								<TableHead>Areas</TableHead>
								<TableHead>Docs</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Applied</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: itemsPerPage }).map((_, i) => (
									<TableRow key={`loading-${i}`}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
												<div className="space-y-2">
													<div className="h-4 w-24 bg-muted animate-pulse rounded" />
													<div className="h-3 w-32 bg-muted animate-pulse rounded" />
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="h-4 w-20 bg-muted animate-pulse rounded" />
										</TableCell>
										<TableCell>
											<div className="h-4 w-24 bg-muted animate-pulse rounded" />
										</TableCell>
										<TableCell>
											<div className="h-4 w-8 bg-muted animate-pulse rounded" />
										</TableCell>
										<TableCell>
											<div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
										</TableCell>
										<TableCell>
											<div className="h-4 w-20 bg-muted animate-pulse rounded" />
										</TableCell>
										<TableCell>
											<div className="h-8 w-8 bg-muted animate-pulse rounded" />
										</TableCell>
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-center py-8 text-destructive"
									>
										{error}
									</TableCell>
								</TableRow>
							) : therapists.length > 0 ? (
								therapists.map((t) => (
									<TableRow key={t.id}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={t.image_url || "/placeholder.svg"}
														alt={t.first_name || "Therapist"}
													/>
													<AvatarFallback>
														{t.first_name?.charAt(0) ||
															t.last_name?.charAt(0) ||
															"T"}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">
														{[t.first_name, t.last_name]
															.filter(Boolean)
															.join(" ") || "No name"}
													</div>
													<div className="text-sm text-muted-foreground">
														{t.email || t.phone_number || "—"}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>{t.specialty || "—"}</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground">
												{t.areas.length > 0 ? t.areas.join(", ") : "—"}
											</span>
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center gap-1 text-sm">
												<FileText className="h-3.5 w-3.5 text-muted-foreground" />
												{t.document_count}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={STATUS_BADGE_CLASS[t.account_status]}
											>
												{STATUS_LABELS[t.account_status]}
											</Badge>
										</TableCell>
										<TableCell>{formatDate(t.created_at)}</TableCell>
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
													<DropdownMenuItem onClick={() => openDetails(t)}>
														<Eye className="mr-2 h-4 w-4" />
														View details
													</DropdownMenuItem>
													<PermissionGate
														permissions={[Permission.ApproveTherapists]}
													>
														{t.account_status !== "approved" && (
															<DropdownMenuItem onClick={() => openApprove(t)}>
																<CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
																Approve
															</DropdownMenuItem>
														)}
													</PermissionGate>
													<PermissionGate
														permissions={[Permission.DeclineTherapists]}
													>
														{t.account_status !== "rejected" && (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	className="text-destructive"
																	onClick={() => openDecline(t)}
																>
																	<XCircle className="mr-2 h-4 w-4" />
																	Decline
																</DropdownMenuItem>
															</>
														)}
													</PermissionGate>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-8">
										No therapists found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{!loading && !error && therapists.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-sm text-muted-foreground">
							Showing {Math.min(total, (page - 1) * itemsPerPage + 1)} to{" "}
							{Math.min(total, page * itemsPerPage)} of {total} therapists
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

			<TherapistDetailsSheet
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				therapistId={selected?.id ?? null}
				onApprove={() => {
					setDetailsOpen(false);
					if (selected) openApprove(selected);
				}}
				onDecline={() => {
					setDetailsOpen(false);
					if (selected) openDecline(selected);
				}}
			/>

			<ApproveTherapistDialog
				open={approveOpen}
				onOpenChange={setApproveOpen}
				therapist={selected}
				onSuccess={fetchTherapists}
			/>

			<DeclineTherapistDialog
				open={declineOpen}
				onOpenChange={setDeclineOpen}
				therapist={selected}
				onSuccess={fetchTherapists}
			/>
		</>
	);
}
