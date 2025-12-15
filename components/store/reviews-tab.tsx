"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Plus,
	Star,
	MoreHorizontal,
	Edit,
	Trash2,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { SortConfig, sortData, toggleSort } from "@/lib/table-sort";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { BulkReviewDialog } from "@/components/store/bulk-review-dialog";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import type { ProductReview, ProductWithJoints } from "@/types/store-types";

export function ReviewsTab() {
	const [reviews, setReviews] = useState<ProductReview[]>([]);
	const [products, setProducts] = useState<ProductWithJoints[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedReview, setSelectedReview] = useState<ProductReview | null>(
		null
	);
	const [showBulkDialog, setShowBulkDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		column: null,
		direction: null,
	});
	const { toast } = useToast();

	const sortedReviews = useMemo(
		() =>
			sortData(reviews, sortConfig, {
				rating: (item) => item.rating,
				date: (item) => new Date(item.created_at).getTime(),
			}),
		[reviews, sortConfig]
	);

	useEffect(() => {
		fetchReviews();
		fetchProducts();
	}, []);

	const fetchReviews = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/store/reviews");
			if (!response.ok) throw new Error("Failed to fetch reviews");
			const result = await response.json();
			setReviews(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load reviews",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchProducts = async () => {
		try {
			const response = await fetch("/api/protected/store/products");
			if (response.ok) {
				const result = await response.json();
				setProducts(result.data);
			}
		} catch (error) {
			console.error("Failed to fetch products:", error);
		}
	};

	const handleDeleteReview = async () => {
		if (!selectedReview) return;

		try {
			const response = await fetch(
				`/api/protected/store/reviews/${selectedReview.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete review");

			toast({
				title: "Success",
				description: "Review deleted successfully",
			});

			setShowDeleteDialog(false);
			setSelectedReview(null);
			fetchReviews();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to delete review",
			});
		}
	};

	const renderStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, i) => (
			<Star
				key={i}
				className={`h-4 w-4 ${
					i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
				}`}
			/>
		));
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Product Reviews</CardTitle>
					<CardDescription>
						Manage product reviews and add bulk reviews for testing
					</CardDescription>
				</div>
				<PermissionGate permissions={[Permission.CreateStoreItems]}>
					<Button onClick={() => setShowBulkDialog(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Add Bulk Reviews
					</Button>
				</PermissionGate>
			</CardHeader>

			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Product</TableHead>
							<TableHead
								className="cursor-pointer select-none hover:bg-muted/50"
								onClick={() => setSortConfig(toggleSort(sortConfig, "rating"))}
							>
								<div className="flex items-center gap-1">
									Rating
									{sortConfig.column === "rating" ? (
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
							<TableHead>Comment</TableHead>
							<TableHead
								className="cursor-pointer select-none hover:bg-muted/50"
								onClick={() => setSortConfig(toggleSort(sortConfig, "date"))}
							>
								<div className="flex items-center gap-1">
									Date
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
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 5 }).map((_, index) => (
								<TableRow key={`loading-${index}`}>
									<TableCell>
										<div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
									</TableCell>
								</TableRow>
							))
						) : sortedReviews.length > 0 ? (
							sortedReviews.map((review) => (
								<TableRow key={review.id}>
									<TableCell className="font-medium">
										{/* Product name would be fetched with review */}
										Product ID: {review.product_id}
									</TableCell>
									<TableCell>
										<div className="flex items-center space-x-1">
											{renderStars(review.rating)}
											<span className="ml-2 text-sm text-muted-foreground">
												{review.rating}/5
											</span>
										</div>
									</TableCell>
									<TableCell className="max-w-[300px]">
										<div className="truncate">{review.comment || "—"}</div>
									</TableCell>
									<TableCell>
										{new Date(review.created_at).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<PermissionGate permissions={[Permission.DeleteStoreItems]}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => {
															setSelectedReview(review);
															setShowDeleteDialog(true);
														}}
														className="text-destructive"
													>
														<Trash2 className="h-4 w-4 mr-2" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</PermissionGate>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center py-8 text-muted-foreground"
								>
									No reviews found. Add some bulk reviews to get started.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>

			{/* Bulk Review Dialog */}
			<BulkReviewDialog
				open={showBulkDialog}
				onOpenChange={setShowBulkDialog}
				onSuccess={fetchReviews}
				products={products}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteReview}
				title="Delete Review"
				description="Are you sure you want to delete this review? This action cannot be undone."
			/>
		</Card>
	);
}
