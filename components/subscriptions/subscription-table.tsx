"use client";

import { useState, useEffect } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
	MoreHorizontal,
	Edit,
	Ban,
	Eye,
	Calendar,
	User,
	CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import {
	ProgramSubscriptionWithDetails,
	SubscriptionFilters,
	PaymentStatus,
} from "@/types/subscription-types";
import { Permission } from "@/types/permission-types";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog";
import { CancelSubscriptionDialog } from "@/components/subscriptions/cancel-subscription-dialog";
import { toast } from "@/components/ui/use-toast";

interface SubscriptionTableProps {
	filters: SubscriptionFilters;
}

export function SubscriptionTable({ filters }: SubscriptionTableProps) {
	const [subscriptions, setSubscriptions] = useState<
		ProgramSubscriptionWithDetails[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [selectedSubscription, setSelectedSubscription] =
		useState<ProgramSubscriptionWithDetails | null>(null);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showViewDialog, setShowViewDialog] = useState(false);

	const itemsPerPage = 10;

	// Load subscriptions data
	useEffect(() => {
		loadSubscriptions();
	}, [filters, currentPage]);

	const loadSubscriptions = async () => {
		setLoading(true);
		try {
			const searchParams = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				...(filters.search && { search: filters.search }),
				...(filters.status &&
					filters.status !== "all" && { status: filters.status }),
				...(filters.payment_status && {
					payment_status: filters.payment_status,
				}),
				...(filters.payment_method && {
					payment_method: filters.payment_method,
				}),
			});

			const response = await fetch(
				`/api/protected/exercise-programs/subscriptions?${searchParams}`
			);

			if (response.ok) {
				const data = await response.json();
				setSubscriptions(data.data || []);
				setTotalPages(data.meta?.totalPages || 1);
				setTotalItems(data.meta?.total || 0);
			} else {
				toast({
					title: "Error",
					description: "Failed to load subscriptions",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error loading subscriptions:", error);
			toast({
				title: "Error",
				description: "Failed to load subscriptions",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (subscription: ProgramSubscriptionWithDetails) => {
		setSelectedSubscription(subscription);
		setShowEditDialog(true);
	};

	const handleCancel = (subscription: ProgramSubscriptionWithDetails) => {
		setSelectedSubscription(subscription);
		setShowCancelDialog(true);
	};

	const handleView = (subscription: ProgramSubscriptionWithDetails) => {
		setSelectedSubscription(subscription);
		setShowViewDialog(true);
	};

	const getStatusBadge = (subscription: ProgramSubscriptionWithDetails) => {
		if (subscription.is_cancelled) {
			return <Badge variant="destructive">Cancelled</Badge>;
		}
		if (subscription.is_active) {
			return <Badge variant="default">Active</Badge>;
		}
		return <Badge variant="secondary">Inactive</Badge>;
	};

	const getPaymentStatusBadge = (status: PaymentStatus) => {
		const variants = {
			pending: "secondary",
			completed: "default",
			failed: "destructive",
			refunded: "outline",
		} as const;

		return (
			<Badge variant={variants[status] || "secondary"}>
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		);
	};

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "MMM dd, yyyy");
	};

	const formatCurrency = (amount: number, currency: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(amount);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Loading subscriptions...</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="flex items-center space-x-4">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[200px]" />
									<Skeleton className="h-4 w-[150px]" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Program Subscriptions</CardTitle>
					<CardDescription>
						{totalItems} subscription{totalItems !== 1 ? "s" : ""} found
					</CardDescription>
				</CardHeader>
				<CardContent>
					{subscriptions.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">No subscriptions found</p>
						</div>
					) : (
						<div className="space-y-4">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Patient</TableHead>
											<TableHead>Program</TableHead>
											<TableHead>Payment</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Period</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{subscriptions.map((subscription) => (
											<TableRow key={subscription.id}>
												<TableCell>
													<div className="flex items-center space-x-3">
														<div className="flex-shrink-0">
															<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
																<User className="h-4 w-4 text-primary" />
															</div>
														</div>
														<div>
															<div className="font-medium">
																{subscription.patient.name}
															</div>
															<div className="text-sm text-muted-foreground">
																{subscription.patient.email}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<div className="font-medium">
															{subscription.program.name}
														</div>
														<div className="text-sm text-muted-foreground">
															{formatCurrency(
																subscription.program.price,
																subscription.program.currency
															)}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<CreditCard className="h-4 w-4 text-muted-foreground" />
														<div>
															<div className="font-medium">
																{formatCurrency(
																	subscription.payment.amount,
																	subscription.payment.currency
																)}
															</div>
															<div className="text-sm text-muted-foreground">
																{subscription.payment.payment_method}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-col space-y-1">
														{getStatusBadge(subscription)}
														{getPaymentStatusBadge(subscription.payment.status)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<Calendar className="h-4 w-4 text-muted-foreground" />
														<div>
															<div className="text-sm">
																{formatDate(subscription.start_date)} -{" "}
																{formatDate(subscription.end_date)}
															</div>
															<div className="text-xs text-muted-foreground">
																{subscription.program.duration_days} days
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" className="h-8 w-8 p-0">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => handleView(subscription)}
															>
																<Eye className="mr-2 h-4 w-4" />
																View Details
															</DropdownMenuItem>
															<PermissionGate
																permissions={[Permission.UpdateSubscriptions]}
															>
																<DropdownMenuItem
																	onClick={() => handleEdit(subscription)}
																>
																	<Edit className="mr-2 h-4 w-4" />
																	Edit
																</DropdownMenuItem>
															</PermissionGate>
															<PermissionGate
																permissions={[Permission.CancelSubscriptions]}
															>
																{!subscription.is_cancelled && (
																	<DropdownMenuItem
																		onClick={() => handleCancel(subscription)}
																		className="text-red-600"
																	>
																		<Ban className="mr-2 h-4 w-4" />
																		Cancel
																	</DropdownMenuItem>
																)}
															</PermissionGate>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex justify-center">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() =>
														handlePageChange(Math.max(1, currentPage - 1))
													}
													className={
														currentPage === 1
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
											{[...Array(totalPages)].map((_, index) => {
												const page = index + 1;
												return (
													<PaginationItem key={page}>
														<PaginationLink
															onClick={() => handlePageChange(page)}
															isActive={currentPage === page}
															className="cursor-pointer"
														>
															{page}
														</PaginationLink>
													</PaginationItem>
												);
											})}
											<PaginationItem>
												<PaginationNext
													onClick={() =>
														handlePageChange(
															Math.min(totalPages, currentPage + 1)
														)
													}
													className={
														currentPage === totalPages
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Edit Dialog */}
			<SubscriptionFormDialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				subscription={selectedSubscription || undefined}
				onSuccess={() => {
					setShowEditDialog(false);
					loadSubscriptions();
				}}
			/>

			{/* Cancel Dialog */}
			<CancelSubscriptionDialog
				open={showCancelDialog}
				onOpenChange={setShowCancelDialog}
				subscription={selectedSubscription}
				onSuccess={() => {
					setShowCancelDialog(false);
					loadSubscriptions();
				}}
			/>

			{/* View Dialog - You can implement this as a simple display dialog */}
			{/* For now, we'll use the edit dialog for viewing */}
		</>
	);
}
