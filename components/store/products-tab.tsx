"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Plus,
	MoreHorizontal,
	Edit,
	Trash2,
	Package,
	Eye,
	Star,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { SortConfig, sortData, toggleSort } from "@/lib/table-sort";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
import { toast, useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import { ProductFormModal } from "@/components/store/product-form-modal";
import type {
	ProductWithJoints,
	ProductWithDetails,
	ProductImage,
	ProductJointName,
	Currency,
	RentTerm,
} from "@/types/store-types";

export function ProductsTab() {
	const [products, setProducts] = useState<ProductWithJoints[]>([]);
	const [joints, setJoints] = useState<ProductJointName[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] =
		useState<ProductWithJoints | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showDetailsPanel, setShowDetailsPanel] = useState(false);
	const [productDetails, setProductDetails] =
		useState<ProductWithDetails | null>(null);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		column: null,
		direction: null,
	});

	const { toast } = useToast();

	const sortedProducts = useMemo(
		() =>
			sortData(products, sortConfig, {
				name: (item) => item.name,
				price: (item) => item.price,
				stock: (item) => item.stock,
			}),
		[products, sortConfig]
	);

	useEffect(() => {
		fetchProducts();
		fetchJoints();
	}, []);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/store/products");
			if (!response.ok) throw new Error("Failed to fetch products");
			const result = await response.json();
			setProducts(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load products",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchJoints = async () => {
		try {
			const response = await fetch("/api/protected/store/joints");
			if (response.ok) {
				const result = await response.json();
				setJoints(result.data);
			}
		} catch (error) {
			console.error("Failed to fetch joints:", error);
		}
	};

	const fetchProductDetails = async (productId: number) => {
		try {
			setDetailsLoading(true);
			const response = await fetch(
				`/api/protected/store/products/${productId}`
			);
			if (!response.ok) throw new Error("Failed to fetch product details");
			const result = await response.json();
			setProductDetails(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load product details",
			});
		} finally {
			setDetailsLoading(false);
		}
	};

	const handleCreateSuccess = () => {
		fetchProducts();
	};

	const handleEditSuccess = () => {
		fetchProducts();
	};

	const handleDeleteProduct = async () => {
		if (!selectedProduct) return;

		try {
			const response = await fetch(
				`/api/protected/store/products/${selectedProduct.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete product");

			toast({
				title: "Success",
				description: "Product deleted successfully",
			});

			setShowDeleteDialog(false);
			setSelectedProduct(null);
			fetchProducts();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to delete product",
			});
		}
	};

	const openCreateModal = () => {
		setShowCreateModal(true);
	};

	const openEditModal = async (product: ProductWithJoints) => {
		setSelectedProduct(product);
		setShowEditModal(true);
	};

	const openDetailsPanel = async (product: ProductWithJoints) => {
		setShowDetailsPanel(true);
		await fetchProductDetails(product.id);
	};

	const formatPrice = (price: number, currency: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(price);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Products</CardTitle>
					<CardDescription>
						Manage products in your store with images, tags, and joint
						associations
					</CardDescription>
				</div>
				<PermissionGate permissions={[Permission.CreateStoreItems]}>
					<Button onClick={openCreateModal}>
						<Plus className="h-4 w-4 mr-2" />
						Add Product
					</Button>
				</PermissionGate>
			</CardHeader>

			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead
								className="cursor-pointer select-none hover:bg-muted/50"
								onClick={() => setSortConfig(toggleSort(sortConfig, "name"))}
							>
								<div className="flex items-center gap-1">
									Product
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
								onClick={() => setSortConfig(toggleSort(sortConfig, "price"))}
							>
								<div className="flex items-center gap-1">
									Price
									{sortConfig.column === "price" ? (
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
								onClick={() => setSortConfig(toggleSort(sortConfig, "stock"))}
							>
								<div className="flex items-center gap-1">
									Stock
									{sortConfig.column === "stock" ? (
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
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 5 }).map((_, index) => (
								<TableRow key={`loading-${index}`}>
									<TableCell>
										<div className="flex items-center space-x-3">
											<div className="h-10 w-10 bg-muted animate-pulse rounded overflow-hidden flex-shrink-0"></div>
											<div className="space-y-2">
												<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
												<div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
									</TableCell>
								</TableRow>
							))
						) : sortedProducts.length > 0 ? (
							sortedProducts.map((product) => (
								<TableRow key={product.id}>
									<TableCell>
										<div className="flex items-center space-x-3">
											<div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
												{(() => {
													const mainImage = product.product_images?.find(
														(img) => img.is_main
													);
													const anyImage = product.product_images?.[0];
													const imageUrl =
														mainImage?.image_url || anyImage?.image_url;

													return imageUrl ? (
														<img
															src={imageUrl}
															alt={product.name}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="h-full w-full bg-muted flex items-center justify-center">
															<Package className="h-5 w-5 text-muted-foreground" />
														</div>
													);
												})()}
											</div>
											<div>
												<div className="font-medium">{product.name}</div>
												<div className="text-sm text-muted-foreground truncate max-w-[200px]">
													{product.description || "No description"}
												</div>
											</div>
										</div>
									</TableCell>

									<TableCell>
										<div className="space-y-1">
											<div className="font-medium">
												{formatPrice(product.price, product.currency)}
											</div>
											{product.discounted_price && (
												<div className="text-sm text-green-600">
													{formatPrice(
														product.discounted_price,
														product.currency
													)}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div
											className={`text-sm ${
												product.stock === 0
													? "text-destructive"
													: product.stock < 10
													? "text-yellow-600"
													: "text-green-600"
											}`}
										>
											{product.stock} units
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Badge
												variant={product.is_available ? "default" : "secondary"}
												className={
													product.is_available
														? "bg-green-500/20 text-green-500"
														: ""
												}
											>
												{product.is_available ? "Available" : "Unavailable"}
											</Badge>
											{product.is_featured && (
												<Badge
													variant="outline"
													className="text-blue-600 border-blue-600"
												>
													Featured
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>
										<PermissionGate
											permissions={[
												Permission.UpdateStoreItems,
												Permission.DeleteStoreItems,
											]}
										>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => openDetailsPanel(product)}
													>
														<Eye className="h-4 w-4 mr-2" />
														View Details
													</DropdownMenuItem>
													<PermissionGate
														permissions={[Permission.UpdateStoreItems]}
													>
														<DropdownMenuItem
															onClick={() => openEditModal(product)}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
													</PermissionGate>
													<PermissionGate
														permissions={[Permission.DeleteStoreItems]}
													>
														<DropdownMenuItem
															onClick={() => {
																setSelectedProduct(product);
																setShowDeleteDialog(true);
															}}
															className="text-destructive"
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</PermissionGate>
												</DropdownMenuContent>
											</DropdownMenu>
										</PermissionGate>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-muted-foreground"
								>
									No products found. Create your first product to get started.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>

			{/* Create Product Modal */}
			<ProductFormModal
				open={showCreateModal}
				onOpenChange={setShowCreateModal}
				onSuccess={handleCreateSuccess}
				title="Create Product"
				description="Add a new product to your store with all the details"
			/>

			{/* Edit Product Modal */}
			<ProductFormModal
				open={showEditModal}
				onOpenChange={setShowEditModal}
				onSuccess={handleEditSuccess}
				title="Edit Product"
				description="Update product information"
				product={selectedProduct as any}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteProduct}
				title="Delete Product"
				description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
			/>

			{/* Product Details Panel */}
			<Sheet open={showDetailsPanel} onOpenChange={setShowDetailsPanel}>
				<SheetContent className="w-full sm:w-[40%] sm:max-w-none overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Product Details</SheetTitle>
						<SheetDescription>
							Complete information about the selected product
						</SheetDescription>
					</SheetHeader>

					{detailsLoading ? (
						<div className="space-y-6 mt-6">
							<div className="space-y-4">
								<div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
								<div className="h-8 bg-muted animate-pulse rounded"></div>
								<div className="h-20 bg-muted animate-pulse rounded"></div>
							</div>
						</div>
					) : productDetails ? (
						<div className="space-y-8 mt-6">
							{/* Product Images */}
							<div className="space-y-4">
								<h3 className="font-semibold text-xl text-foreground">
									Images
								</h3>
								{productDetails.product_images &&
								Array.isArray(productDetails.product_images) &&
								productDetails.product_images.length > 0 ? (
									<div className="grid grid-cols-2 gap-4">
										{productDetails.product_images.map(
											(image: ProductImage, index: number) => (
												<div
													key={image.id}
													className={`relative rounded-lg overflow-hidden ${
														image.is_main
															? "ring-2 ring-blue-500 ring-offset-2"
															: ""
													}`}
												>
													<img
														src={image.image_url}
														alt={`${productDetails.name} ${index + 1}`}
														className="w-full h-36 object-cover border border-border"
													/>
													{image.is_main && (
														<Badge className="absolute top-2 left-2 text-xs bg-blue-600 text-white shadow-lg">
															⭐ Main
														</Badge>
													)}
												</div>
											)
										)}
									</div>
								) : (
									<div className="bg-muted/30 p-6 rounded-lg text-center border border-dashed">
										<div className="text-sm text-muted-foreground mb-2">
											No images uploaded for this product
										</div>
										<div className="text-xs text-muted-foreground">
											Images can be added when creating or editing the product
										</div>
									</div>
								)}
							</div>

							{/* Information */}
							<div className="space-y-5">
								<h3 className="font-semibold text-xl text-foreground">
									Information
								</h3>
								<div className="space-y-6">
									<div className="grid grid-cols-1 gap-1">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Product
										</label>
										<div className="flex items-baseline gap-3">
											<p className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">
												ID: {productDetails.id}
											</p>
											<p className="text-2xl font-bold text-foreground">
												{productDetails.name}
											</p>
										</div>
									</div>

									<div className="grid grid-cols-1 gap-1">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Description
										</label>
										{productDetails.description ? (
											<p className="text-sm leading-relaxed text-foreground bg-muted/20 p-3 rounded-md">
												{productDetails.description}
											</p>
										) : (
											<p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-md">
												No description provided
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Pricing Information */}
							<div className="space-y-5">
								<h3 className="font-semibold text-xl text-foreground">
									Pricing
								</h3>
								<div className="space-y-6">
									<div className="grid grid-cols-2 gap-6">
										<div className="grid grid-cols-1 gap-1">
											<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
												Price
											</label>
											<p className="text-xl font-bold text-foreground">
												{formatPrice(
													productDetails.price,
													productDetails.currency
												)}
											</p>
										</div>

										<div className="grid grid-cols-1 gap-1">
											<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
												Discounted Price
											</label>
											{productDetails.discounted_price ? (
												<p className="text-xl font-bold text-green-600">
													{formatPrice(
														productDetails.discounted_price,
														productDetails.currency
													)}
												</p>
											) : (
												<p className="text-sm text-muted-foreground italic">
													No discount applied
												</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-1 gap-1">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Rent Term
										</label>
										{productDetails.is_for_rent && productDetails.rent_term ? (
											<div>
												<Badge variant="outline" className="text-sm px-3 py-1">
													{productDetails.rent_term
														.replace("_", " ")
														.replace(/\b\w/g, (l) => l.toUpperCase())}
												</Badge>
											</div>
										) : (
											<p className="text-sm text-muted-foreground italic">
												{productDetails.is_for_rent
													? "Rent term not specified"
													: "Not available for rent"}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Inventory & Status */}
							<div className="space-y-5">
								<h3 className="font-semibold text-xl text-foreground">
									Status & Inventory
								</h3>
								<div className="space-y-6">
									<div className="grid grid-cols-2 gap-6">
										<div className="grid grid-cols-1 gap-1">
											<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
												Stock
											</label>
											<p
												className={`text-lg font-bold ${
													productDetails.stock === 0
														? "text-destructive"
														: productDetails.stock < 10
														? "text-yellow-600"
														: "text-green-600"
												}`}
											>
												{productDetails.stock} units
											</p>
										</div>

										<div className="grid grid-cols-1 gap-1">
											<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
												Availability
											</label>
											<div>
												<Badge
													variant={
														productDetails.is_available
															? "default"
															: "secondary"
													}
													className={`text-sm px-3 py-1 ${
														productDetails.is_available
															? "bg-green-500/20 text-green-600"
															: "bg-red-500/20 text-red-600"
													}`}
												>
													{productDetails.is_available
														? "Available"
														: "Unavailable"}
												</Badge>
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 gap-1">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Special Labels
										</label>
										<div className="flex flex-wrap gap-2">
											{productDetails.is_featured && (
												<Badge
													variant="outline"
													className="text-blue-600 border-blue-600 px-3 py-1"
												>
													Featured
												</Badge>
											)}
											{productDetails.is_best_seller && (
												<Badge
													variant="outline"
													className="text-yellow-600 border-yellow-600 px-3 py-1"
												>
													<Star className="h-3 w-3 mr-1 fill-current" />
													Best Seller
												</Badge>
											)}
											{productDetails.is_for_rent && (
												<Badge
													variant="outline"
													className="text-purple-600 border-purple-600 px-3 py-1"
												>
													For Rent
												</Badge>
											)}
											{!productDetails.is_featured &&
												!productDetails.is_best_seller &&
												!productDetails.is_for_rent && (
													<p className="text-sm text-muted-foreground italic">
														No special labels
													</p>
												)}
										</div>
									</div>
								</div>
							</div>

							{/* Reviews */}
							<div className="space-y-5">
								<h3 className="font-semibold text-xl text-foreground">
									Reviews
								</h3>
								{(productDetails.review_count || 0) > 0 ? (
									<div className="grid grid-cols-2 gap-6">
										<div className="grid grid-cols-1 gap-1">
											<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
												Average Rating
											</label>
											<div className="flex items-center gap-3">
												<span className="text-3xl font-bold text-foreground">
													{productDetails.average_rating?.toFixed(1) || "0.0"}
												</span>
												<div className="flex">
													{[1, 2, 3, 4, 5].map((star) => (
														<Star
															key={star}
															className={`h-5 w-5 ${
																star <=
																Math.round(productDetails.average_rating || 0)
																	? "text-yellow-500 fill-current"
																	: "text-gray-300"
															}`}
														/>
													))}
												</div>
											</div>
										</div>
										<div className="grid grid-cols-1 gap-1">
											<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
												Total Reviews
											</label>
											<p className="text-xl font-bold text-foreground">
												{productDetails.review_count} reviews
											</p>
										</div>
									</div>
								) : (
									<div className="text-sm text-muted-foreground italic bg-muted/30 p-6 rounded-lg text-center border border-dashed">
										No reviews yet
									</div>
								)}
							</div>

							{/* Body Joints */}
							<div className="space-y-4">
								<h3 className="font-semibold text-xl text-foreground">
									Related Body Joints
								</h3>
								{productDetails.joints && productDetails.joints.length > 0 ? (
									<div className="flex flex-wrap gap-3">
										{productDetails.joints.map((joint) => (
											<Badge
												key={joint.id}
												variant="outline"
												className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
											>
												{joint.name}
											</Badge>
										))}
									</div>
								) : (
									<div className="text-sm text-muted-foreground italic bg-muted/30 p-6 rounded-lg text-center border border-dashed">
										No body joints associated
									</div>
								)}
							</div>

							{/* Tags */}
							<div className="space-y-4">
								<h3 className="font-semibold text-xl text-foreground">Tags</h3>
								{productDetails.tags && productDetails.tags.length > 0 ? (
									<div className="flex flex-wrap gap-3">
										{productDetails.tags.map((tag, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="text-sm px-3 py-1 bg-gray-100 text-gray-700"
											>
												{tag}
											</Badge>
										))}
									</div>
								) : (
									<div className="text-sm text-muted-foreground italic bg-muted/30 p-6 rounded-lg text-center border border-dashed">
										No tags added
									</div>
								)}
							</div>

							{/* Timestamps */}
							<div className="space-y-5 border-t border-border pt-6">
								<h3 className="font-semibold text-xl text-foreground">
									Timestamps
								</h3>
								<div className="grid grid-cols-1 gap-4">
									<div className="grid grid-cols-1 gap-1">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Created
										</label>
										<p className="text-sm font-mono bg-muted/30 px-3 py-2 rounded-md">
											{new Date(productDetails.created_at).toLocaleString()}
										</p>
									</div>
									<div className="grid grid-cols-1 gap-1">
										<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Last Updated
										</label>
										<p className="text-sm font-mono bg-muted/30 px-3 py-2 rounded-md">
											{new Date(productDetails.updated_at).toLocaleString()}
										</p>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="mt-6 text-center text-muted-foreground">
							No product details available
						</div>
					)}
				</SheetContent>
			</Sheet>
		</Card>
	);
}
