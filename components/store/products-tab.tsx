"use client";

import { useState, useEffect } from "react";
import {
	Plus,
	MoreHorizontal,
	Edit,
	Trash2,
	Package,
	Star,
	Eye,
	Upload,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { createClient } from "@/lib/supabase/client";
import type {
	ProductWithCategory,
	Category,
	Joint,
	Currency,
	RentTerm,
} from "@/types/store-types";

export function ProductsTab() {
	const [products, setProducts] = useState<ProductWithCategory[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [joints, setJoints] = useState<Joint[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] =
		useState<ProductWithCategory | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [formLoading, setFormLoading] = useState(false);
	const [uploading, setUploading] = useState(false);

	// Form data state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		price: 0,
		discounted_price: 0,
		currency: "EGP" as Currency,
		stock: 0,
		category_id: 0,
		is_best_seller: false,
		is_featured: false,
		is_available: true,
		is_for_rent: false,
		rent_term: "" as RentTerm | "",
		tags: [] as string[],
		joint_ids: [] as number[],
		images: [] as { url: string; is_main: boolean }[],
	});
	const [newTag, setNewTag] = useState("");

	const { toast } = useToast();

	useEffect(() => {
		fetchProducts();
		fetchCategories();
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

	const fetchCategories = async () => {
		try {
			const response = await fetch("/api/protected/store/categories");
			if (response.ok) {
				const result = await response.json();
				setCategories(result.data);
			}
		} catch (error) {
			console.error("Failed to fetch categories:", error);
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

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: 0,
			discounted_price: 0,
			currency: "EGP",
			stock: 0,
			category_id: 0,
			is_best_seller: false,
			is_featured: false,
			is_available: true,
			is_for_rent: false,
			rent_term: "",
			tags: [],
			joint_ids: [],
			images: [],
		});
		setNewTag("");
	};

	const handleCreateProduct = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setFormLoading(true);

			const submitData = {
				...formData,
				discounted_price: formData.discounted_price || undefined,
				rent_term: formData.is_for_rent ? formData.rent_term : undefined,
			};

			const response = await fetch("/api/protected/store/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(submitData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create product");
			}

			toast({
				title: "Success",
				description: "Product created successfully",
			});

			setShowCreateModal(false);
			resetForm();
			fetchProducts();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create product",
			});
		} finally {
			setFormLoading(false);
		}
	};

	const handleEditProduct = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedProduct) return;

		try {
			setFormLoading(true);

			const submitData = {
				...formData,
				discounted_price: formData.discounted_price || undefined,
				rent_term: formData.is_for_rent ? formData.rent_term : undefined,
			};

			const response = await fetch(
				`/api/protected/store/products/${selectedProduct.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(submitData),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update product");
			}

			toast({
				title: "Success",
				description: "Product updated successfully",
			});

			setShowEditModal(false);
			setSelectedProduct(null);
			resetForm();
			fetchProducts();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to update product",
			});
		} finally {
			setFormLoading(false);
		}
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

	const uploadImage = async (file: File) => {
		const supabase = createClient();
		const fileExt = file.name.split(".").pop();
		const fileName = `${Date.now()}.${fileExt}`;

		const { data, error } = await supabase.storage
			.from("product-images")
			.upload(fileName, file);

		if (error) throw error;

		const {
			data: { publicUrl },
		} = supabase.storage.from("product-images").getPublicUrl(fileName);

		return publicUrl;
	};

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setUploading(true);
			const imageUrl = await uploadImage(file);

			const isFirstImage = formData.images.length === 0;

			setFormData((prev) => ({
				...prev,
				images: [...prev.images, { url: imageUrl, is_main: isFirstImage }],
			}));

			toast({
				title: "Success",
				description: "Image uploaded successfully",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to upload image",
			});
		} finally {
			setUploading(false);
		}
	};

	const removeImage = (index: number) => {
		const newImages = formData.images.filter((_, i) => i !== index);

		// If we removed the main image, make the first remaining image main
		if (newImages.length > 0 && formData.images[index].is_main) {
			newImages[0].is_main = true;
		}

		setFormData((prev) => ({ ...prev, images: newImages }));
	};

	const setMainImage = (index: number) => {
		const newImages = formData.images.map((img, i) => ({
			...img,
			is_main: i === index,
		}));
		setFormData((prev) => ({ ...prev, images: newImages }));
	};

	const addTag = () => {
		if (!newTag.trim()) return;

		if (!formData.tags.includes(newTag.trim())) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, newTag.trim()],
			}));
		}
		setNewTag("");
	};

	const removeTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	const openCreateModal = () => {
		resetForm();
		setShowCreateModal(true);
	};

	const openEditModal = (product: ProductWithCategory) => {
		setSelectedProduct(product);
		setFormData({
			name: product.name,
			description: product.description || "",
			price: product.price,
			discounted_price: product.discounted_price || 0,
			currency: product.currency,
			stock: product.stock,
			category_id: product.category_id,
			is_best_seller: product.is_best_seller,
			is_featured: product.is_featured,
			is_available: product.is_available,
			is_for_rent: product.is_for_rent,
			rent_term: product.rent_term || "",
			tags: product.tags || [],
			joint_ids: [], // TODO: populate from product.joints when available
			images: [], // TODO: populate from product.images when available
		});
		setShowEditModal(true);
	};

	const formatPrice = (price: number, currency: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(price);
	};

	const renderProductForm = () => (
		<form
			onSubmit={showCreateModal ? handleCreateProduct : handleEditProduct}
			className="space-y-6"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Basic Information */}
				<div className="space-y-4">
					<h3 className="font-semibold">Basic Information</h3>

					<div>
						<label className="block text-sm font-medium mb-2">
							Product Name
						</label>
						<Input
							placeholder="Enter product name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Description
						</label>
						<Textarea
							placeholder="Enter product description"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							className="resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">Category</label>
						<Select
							value={formData.category_id.toString()}
							onValueChange={(value) =>
								setFormData((prev) => ({
									...prev,
									category_id: parseInt(value),
								}))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category.id} value={category.id.toString()}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Pricing */}
				<div className="space-y-4">
					<h3 className="font-semibold">Pricing</h3>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">Price</label>
							<Input
								type="number"
								step="0.01"
								min="0"
								placeholder="0.00"
								value={formData.price}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										price: parseFloat(e.target.value) || 0,
									}))
								}
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Currency</label>
							<Select
								value={formData.currency}
								onValueChange={(value: Currency) =>
									setFormData((prev) => ({ ...prev, currency: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"EGP",
										"USD",
										"EUR",
										"GBP",
										"AED",
										"SAR",
										"KWD",
										"BHD",
										"OMR",
										"QAR",
									].map((currency) => (
										<SelectItem key={currency} value={currency}>
											{currency}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Discounted Price (Optional)
						</label>
						<Input
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							value={formData.discounted_price}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									discounted_price: parseFloat(e.target.value) || 0,
								}))
							}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Stock Quantity
						</label>
						<Input
							type="number"
							min="0"
							placeholder="0"
							value={formData.stock}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									stock: parseInt(e.target.value) || 0,
								}))
							}
							required
						/>
					</div>
				</div>
			</div>

			{/* Product Options */}
			<div className="space-y-4">
				<h3 className="font-semibold">Product Options</h3>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="flex items-center space-x-2">
						<Checkbox
							id="is_available"
							checked={formData.is_available}
							onCheckedChange={(checked) =>
								setFormData((prev) => ({
									...prev,
									is_available: !!checked,
								}))
							}
						/>
						<label htmlFor="is_available" className="text-sm font-medium">
							Available
						</label>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="is_featured"
							checked={formData.is_featured}
							onCheckedChange={(checked) =>
								setFormData((prev) => ({
									...prev,
									is_featured: !!checked,
								}))
							}
						/>
						<label htmlFor="is_featured" className="text-sm font-medium">
							Featured
						</label>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="is_best_seller"
							checked={formData.is_best_seller}
							onCheckedChange={(checked) =>
								setFormData((prev) => ({
									...prev,
									is_best_seller: !!checked,
								}))
							}
						/>
						<label htmlFor="is_best_seller" className="text-sm font-medium">
							Best Seller
						</label>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="is_for_rent"
							checked={formData.is_for_rent}
							onCheckedChange={(checked) =>
								setFormData((prev) => ({
									...prev,
									is_for_rent: !!checked,
								}))
							}
						/>
						<label htmlFor="is_for_rent" className="text-sm font-medium">
							For Rent
						</label>
					</div>
				</div>

				{formData.is_for_rent && (
					<div>
						<label className="block text-sm font-medium mb-2">Rent Term</label>
						<Select
							value={formData.rent_term}
							onValueChange={(value: RentTerm) =>
								setFormData((prev) => ({ ...prev, rent_term: value }))
							}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Select rent term" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="per_day">Per Day</SelectItem>
								<SelectItem value="per_week">Per Week</SelectItem>
								<SelectItem value="per_month">Per Month</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Body Joints */}
			<div className="space-y-4">
				<h3 className="font-semibold">Body Joints</h3>
				<p className="text-sm text-muted-foreground">
					Select body joints this product is related to
				</p>
				<div className="grid grid-cols-3 gap-2">
					{joints.map((joint) => (
						<div key={joint.id} className="flex items-center space-x-2">
							<Checkbox
								id={`joint-${joint.id}`}
								checked={formData.joint_ids.includes(joint.id)}
								onCheckedChange={(checked) => {
									if (checked) {
										setFormData((prev) => ({
											...prev,
											joint_ids: [...prev.joint_ids, joint.id],
										}));
									} else {
										setFormData((prev) => ({
											...prev,
											joint_ids: prev.joint_ids.filter((id) => id !== joint.id),
										}));
									}
								}}
							/>
							<label
								htmlFor={`joint-${joint.id}`}
								className="text-sm font-normal"
							>
								{joint.name}
							</label>
						</div>
					))}
				</div>
			</div>

			{/* Tags */}
			<div className="space-y-4">
				<h3 className="font-semibold">Tags</h3>
				<div className="flex gap-2">
					<Input
						placeholder="Add a tag"
						value={newTag}
						onChange={(e) => setNewTag(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
					/>
					<Button type="button" onClick={addTag} variant="outline">
						Add Tag
					</Button>
				</div>
				<div className="flex flex-wrap gap-2">
					{formData.tags.map((tag, index) => (
						<Badge key={index} variant="secondary" className="pr-1">
							{tag}
							<button
								type="button"
								onClick={() => removeTag(tag)}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			</div>

			{/* Images */}
			<div className="space-y-4">
				<h3 className="font-semibold">Product Images</h3>
				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => document.getElementById("image-upload")?.click()}
							disabled={uploading}
						>
							<Upload className="h-4 w-4 mr-2" />
							{uploading ? "Uploading..." : "Upload Image"}
						</Button>
						<input
							id="image-upload"
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</div>

					<div className="grid grid-cols-3 gap-4">
						{formData.images.map((image, index) => (
							<div key={index} className="relative group">
								<img
									src={image.url}
									alt={`Product image ${index + 1}`}
									className="w-full h-32 object-cover rounded-lg border"
								/>
								<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
									<Button
										type="button"
										size="sm"
										variant={image.is_main ? "default" : "secondary"}
										onClick={() => setMainImage(index)}
									>
										<Star className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										size="sm"
										variant="destructive"
										onClick={() => removeImage(index)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								{image.is_main && (
									<Badge className="absolute top-2 left-2">Main</Badge>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="flex justify-end space-x-2">
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						showCreateModal
							? setShowCreateModal(false)
							: setShowEditModal(false)
					}
					disabled={formLoading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={formLoading || uploading}>
					{formLoading
						? "Saving..."
						: `${showCreateModal ? "Create" : "Update"} Product`}
				</Button>
			</div>
		</form>
	);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Products</CardTitle>
					<CardDescription>
						Manage products in your store with categories, images, tags, and
						joint associations
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
							<TableHead>Product</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Stock</TableHead>
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
											<div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
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
						) : products.length > 0 ? (
							products.map((product) => (
								<TableRow key={product.id}>
									<TableCell>
										<div className="flex items-center space-x-3">
											<div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
												<Package className="h-5 w-5 text-muted-foreground" />
											</div>
											<div>
												<div className="font-medium flex items-center gap-2">
													{product.name}
													{product.is_best_seller && (
														<Star className="h-3 w-3 text-yellow-500 fill-current" />
													)}
												</div>
												<div className="text-sm text-muted-foreground truncate max-w-[200px]">
													{product.description || "No description"}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{product.category.name}</Badge>
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
														onClick={() => {
															// View details logic
														}}
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
			<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Create Product</DialogTitle>
						<DialogDescription>
							Add a new product to your store with all the details
						</DialogDescription>
					</DialogHeader>
					{renderProductForm()}
				</DialogContent>
			</Dialog>

			{/* Edit Product Modal */}
			<Dialog open={showEditModal} onOpenChange={setShowEditModal}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
						<DialogDescription>Update product information</DialogDescription>
					</DialogHeader>
					{renderProductForm()}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteProduct}
				title="Delete Product"
				description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
			/>
		</Card>
	);
}
