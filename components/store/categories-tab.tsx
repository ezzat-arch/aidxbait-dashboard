"use client";

import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import {
	Plus,
	MoreHorizontal,
	Edit,
	Trash2,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	ChevronRight,
	ChevronDown,
} from "lucide-react";
import { SortConfig, sortData, toggleSort } from "@/lib/table-sort";
import { Button } from "@/components/ui/button";
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
import { CategoryFormDialog } from "@/components/store/category-form-dialog";
import { SubcategoryFormDialog } from "@/components/store/subcategory-form-dialog";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import type { StoreCategory, StoreSubcategory } from "@/types/store-types";

export function CategoriesTab() {
	const [categories, setCategories] = useState<StoreCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] =
		useState<StoreCategory | null>(null);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		column: null,
		direction: null,
	});
	const { toast } = useToast();

	// Subcategories (expandable per category)
	const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
		null
	);
	const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
		Record<number, StoreSubcategory[]>
	>({});
	const [loadingSubcategoriesFor, setLoadingSubcategoriesFor] = useState<
		number | null
	>(null);
	const [categoryIdForSubcategory, setCategoryIdForSubcategory] = useState<
		number | null
	>(null);
	const [showCreateSubcategoryDialog, setShowCreateSubcategoryDialog] =
		useState(false);
	const [showEditSubcategoryDialog, setShowEditSubcategoryDialog] =
		useState(false);
	const [showDeleteSubcategoryDialog, setShowDeleteSubcategoryDialog] =
		useState(false);
	const [selectedSubcategory, setSelectedSubcategory] =
		useState<StoreSubcategory | null>(null);

	const sortedCategories = useMemo(
		() =>
			sortData(categories, sortConfig, {
				name: (item) => item.name,
				name_ar: (item) => item.name_ar,
			}),
		[categories, sortConfig]
	);

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/store/categories");
			if (!response.ok) throw new Error("Failed to fetch categories");
			const result = await response.json();
			setCategories(result.data ?? []);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load categories",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCreateCategory = async (data: {
		name: string;
		name_ar: string;
	}) => {
		try {
			const response = await fetch("/api/protected/store/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "Failed to create category");
			}

			toast({
				title: "Success",
				description: "Category created successfully",
			});

			setShowCreateDialog(false);
			fetchCategories();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create category",
			});
		}
	};

	const handleEditCategory = async (data: {
		name: string;
		name_ar: string;
	}) => {
		if (!selectedCategory) return;

		try {
			const response = await fetch(
				`/api/protected/store/categories/${selectedCategory.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "Failed to update category");
			}

			toast({
				title: "Success",
				description: "Category updated successfully",
			});

			setShowEditDialog(false);
			setSelectedCategory(null);
			fetchCategories();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to update category",
			});
		}
	};

	const handleDeleteCategory = async () => {
		if (!selectedCategory) return;

		try {
			const response = await fetch(
				`/api/protected/store/categories/${selectedCategory.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "Failed to delete category");
			}

			toast({
				title: "Success",
				description: "Category deleted successfully",
			});

			setShowDeleteDialog(false);
			setSelectedCategory(null);
			fetchCategories();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete category",
			});
		}
	};

	// Subcategories: fetch when expanding a row
	const fetchSubcategories = useCallback(
		async (categoryId: number) => {
			try {
				setLoadingSubcategoriesFor(categoryId);
				const response = await fetch(
					`/api/protected/store/categories/${categoryId}/subcategories`
				);
				if (!response.ok) throw new Error("Failed to fetch subcategories");
				const result = await response.json();
				setSubcategoriesByCategory((prev) => ({
					...prev,
					[categoryId]: result.data ?? [],
				}));
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: "Failed to load subcategories",
				});
			} finally {
				setLoadingSubcategoriesFor(null);
			}
		},
		[toast]
	);

	const toggleExpandCategory = (category: StoreCategory) => {
		const id = category.id;
		if (expandedCategoryId === id) {
			setExpandedCategoryId(null);
			return;
		}
		setExpandedCategoryId(id);
		if (!(id in subcategoriesByCategory)) {
			fetchSubcategories(id);
		}
	};

	const handleCreateSubcategory = async (data: {
		name: string;
		name_ar: string;
	}) => {
		if (categoryIdForSubcategory == null) return;
		try {
			const response = await fetch(
				`/api/protected/store/categories/${categoryIdForSubcategory}/subcategories`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "Failed to create subcategory");
			}
			toast({
				title: "Success",
				description: "Subcategory created successfully",
			});
			setShowCreateSubcategoryDialog(false);
			setCategoryIdForSubcategory(null);
			fetchSubcategories(categoryIdForSubcategory);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to create subcategory",
			});
		}
	};

	const handleEditSubcategory = async (data: {
		name: string;
		name_ar: string;
	}) => {
		if (!selectedSubcategory || categoryIdForSubcategory == null) return;
		try {
			const response = await fetch(
				`/api/protected/store/categories/${categoryIdForSubcategory}/subcategories/${selectedSubcategory.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "Failed to update subcategory");
			}
			toast({
				title: "Success",
				description: "Subcategory updated successfully",
			});
			setShowEditSubcategoryDialog(false);
			setSelectedSubcategory(null);
			setCategoryIdForSubcategory(null);
			fetchSubcategories(categoryIdForSubcategory);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to update subcategory",
			});
		}
	};

	const handleDeleteSubcategory = async () => {
		if (!selectedSubcategory || categoryIdForSubcategory == null) return;
		try {
			const response = await fetch(
				`/api/protected/store/categories/${categoryIdForSubcategory}/subcategories/${selectedSubcategory.id}`,
				{ method: "DELETE" }
			);
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "Failed to delete subcategory");
			}
			toast({
				title: "Success",
				description: "Subcategory deleted successfully",
			});
			setShowDeleteSubcategoryDialog(false);
			setSelectedSubcategory(null);
			setCategoryIdForSubcategory(null);
			fetchSubcategories(categoryIdForSubcategory);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to delete subcategory",
			});
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Categories</CardTitle>
					<CardDescription>
						Manage store categories. Each category can have subcategories.
					</CardDescription>
				</div>
				<PermissionGate permissions={[Permission.CreateStoreItems]}>
					<Button onClick={() => setShowCreateDialog(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Add Category
					</Button>
				</PermissionGate>
			</CardHeader>

			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10"></TableHead>
							<TableHead
								className="text-center cursor-pointer select-none hover:bg-muted/50"
								onClick={() => setSortConfig(toggleSort(sortConfig, "name"))}
							>
								<div className="flex items-center justify-center gap-1">
									Name (English)
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
								className="text-center cursor-pointer select-none hover:bg-muted/50"
								onClick={() =>
									setSortConfig(toggleSort(sortConfig, "name_ar"))
								}
							>
								<div className="flex items-center justify-center gap-1">
									Name (Arabic)
									{sortConfig.column === "name_ar" ? (
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
									<TableCell className="w-10"></TableCell>
									<TableCell className="text-center">
										<div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto"></div>
									</TableCell>
									<TableCell className="text-center">
										<div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
									</TableCell>
								</TableRow>
							))
						) : sortedCategories.length > 0 ? (
							sortedCategories.map((category) => (
								<React.Fragment key={category.id}>
									<TableRow>
										<TableCell className="w-10 p-0">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => toggleExpandCategory(category)}
												aria-label={
													expandedCategoryId === category.id
														? "Collapse subcategories"
														: "Expand subcategories"
												}
											>
												{expandedCategoryId === category.id ? (
													<ChevronDown className="h-4 w-4" />
												) : (
													<ChevronRight className="h-4 w-4" />
												)}
											</Button>
										</TableCell>
										<TableCell className="font-medium text-center">
											{category.name}
										</TableCell>
										<TableCell className="font-medium text-center" dir="rtl">
											{category.name_ar}
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
														<PermissionGate
															permissions={[Permission.UpdateStoreItems]}
														>
															<DropdownMenuItem
																onClick={() => {
																	setSelectedCategory(category);
																	setShowEditDialog(true);
																}}
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
																	setSelectedCategory(category);
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
									{expandedCategoryId === category.id && (
										<TableRow className="bg-muted/30">
											<TableCell colSpan={4} className="p-4">
												{loadingSubcategoriesFor === category.id ? (
													<div className="flex justify-center py-4">
														<div className="h-6 w-32 bg-muted animate-pulse rounded" />
													</div>
												) : (
													<div className="pl-6 space-y-3">
														<div className="flex items-center justify-between">
															<span className="text-sm font-medium text-muted-foreground">
																Subcategories
															</span>
															<PermissionGate
																permissions={[Permission.CreateStoreItems]}
															>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => {
																		setCategoryIdForSubcategory(category.id);
																		setShowCreateSubcategoryDialog(true);
																	}}
																>
																	<Plus className="h-3 w-3 mr-1" />
																	Add Subcategory
																</Button>
															</PermissionGate>
														</div>
														{(subcategoriesByCategory[category.id]?.length ??
															0) > 0 ? (
															<Table>
																<TableHeader>
																	<TableRow>
																		<TableHead className="text-sm">
																			Name (English)
																		</TableHead>
																		<TableHead className="text-sm">
																			Name (Arabic)
																		</TableHead>
																		<TableHead className="w-[50px]"></TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{subcategoriesByCategory[category.id].map(
																		(sub) => (
																			<TableRow key={sub.id}>
																				<TableCell className="text-sm font-medium">
																					{sub.name}
																				</TableCell>
																				<TableCell
																					className="text-sm font-medium"
																					dir="rtl"
																				>
																					{sub.name_ar}
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
																									<MoreHorizontal className="h-3 w-3" />
																								</Button>
																							</DropdownMenuTrigger>
																							<DropdownMenuContent align="end">
																								<PermissionGate
																									permissions={[
																										Permission.UpdateStoreItems,
																									]}
																								>
																									<DropdownMenuItem
																										onClick={() => {
																											setCategoryIdForSubcategory(
																												category.id
																											);
																											setSelectedSubcategory(
																												sub
																											);
																											setShowEditSubcategoryDialog(
																												true
																											);
																										}}
																									>
																										<Edit className="h-3 w-3 mr-2" />
																										Edit
																									</DropdownMenuItem>
																								</PermissionGate>
																								<PermissionGate
																									permissions={[
																										Permission.DeleteStoreItems,
																									]}
																								>
																									<DropdownMenuItem
																										onClick={() => {
																											setCategoryIdForSubcategory(
																												category.id
																											);
																											setSelectedSubcategory(
																												sub
																											);
																											setShowDeleteSubcategoryDialog(
																												true
																											);
																										}}
																										className="text-destructive"
																									>
																										<Trash2 className="h-3 w-3 mr-2" />
																										Delete
																									</DropdownMenuItem>
																								</PermissionGate>
																							</DropdownMenuContent>
																						</DropdownMenu>
																					</PermissionGate>
																				</TableCell>
																			</TableRow>
																		)
																	)}
																</TableBody>
															</Table>
														) : (
															<p className="text-sm text-muted-foreground py-2">
																No subcategories. Click “Add Subcategory” to add
																one.
															</p>
														)}
													</div>
												)}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center py-8 text-muted-foreground"
								>
									No categories found. Add categories to organize products and
									subcategories.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>

			<CategoryFormDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSubmit={handleCreateCategory}
				title="Create Category"
				description="Add a new store category. You can add subcategories to it later."
			/>

			{selectedCategory && (
				<CategoryFormDialog
					open={showEditDialog}
					onOpenChange={setShowEditDialog}
					onSubmit={handleEditCategory}
					title="Edit Category"
					description="Update category information"
					defaultValues={{
						name: selectedCategory.name,
						name_ar: selectedCategory.name_ar,
					}}
				/>
			)}

			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteCategory}
				title="Delete Category"
				description={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone. Categories with products or subcategories cannot be deleted.`}
			/>

			<SubcategoryFormDialog
				open={showCreateSubcategoryDialog}
				onOpenChange={setShowCreateSubcategoryDialog}
				onSubmit={handleCreateSubcategory}
				title="Add Subcategory"
				description="Add a subcategory to this category. Subcategories help organize products."
			/>

			{selectedSubcategory && (
				<SubcategoryFormDialog
					open={showEditSubcategoryDialog}
					onOpenChange={setShowEditSubcategoryDialog}
					onSubmit={handleEditSubcategory}
					title="Edit Subcategory"
					description="Update subcategory information"
					defaultValues={{
						name: selectedSubcategory.name,
						name_ar: selectedSubcategory.name_ar,
					}}
				/>
			)}

			<DeleteConfirmDialog
				open={showDeleteSubcategoryDialog}
				onOpenChange={setShowDeleteSubcategoryDialog}
				onConfirm={handleDeleteSubcategory}
				title="Delete Subcategory"
				description={`Are you sure you want to delete "${selectedSubcategory?.name}"? Subcategories linked to products cannot be deleted.`}
			/>
		</Card>
	);
}
