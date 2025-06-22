"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import type { Category } from "@/types/store-types";

export function CategoriesTab() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/store/categories");
			if (!response.ok) throw new Error("Failed to fetch categories");
			const result = await response.json();
			setCategories(result.data);
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
		description?: string;
	}) => {
		try {
			const response = await fetch("/api/protected/store/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) throw new Error("Failed to create category");

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
				description: "Failed to create category",
			});
		}
	};

	const handleEditCategory = async (data: {
		name: string;
		description?: string;
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

			if (!response.ok) throw new Error("Failed to update category");

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
				description: "Failed to update category",
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

			if (!response.ok) throw new Error("Failed to delete category");

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
				description: "Failed to delete category",
			});
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Categories</CardTitle>
					<CardDescription>
						Manage product categories for your store
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
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 3 }).map((_, index) => (
								<TableRow key={`loading-${index}`}>
									<TableCell>
										<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
									</TableCell>
								</TableRow>
							))
						) : categories.length > 0 ? (
							categories.map((category) => (
								<TableRow key={category.id}>
									<TableCell className="font-medium">{category.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{category.description || "—"}
									</TableCell>
									<TableCell>
										{new Date(category.created_at).toLocaleDateString()}
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
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center py-8 text-muted-foreground"
								>
									No categories found. Create your first category to get
									started.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>

			{/* Create Category Dialog */}
			<CategoryFormDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSubmit={handleCreateCategory}
				title="Create Category"
				description="Add a new category for organizing your products"
			/>

			{/* Edit Category Dialog */}
			{selectedCategory && (
				<CategoryFormDialog
					open={showEditDialog}
					onOpenChange={setShowEditDialog}
					onSubmit={handleEditCategory}
					title="Edit Category"
					description="Update category information"
					defaultValues={{
						name: selectedCategory.name,
						description: selectedCategory.description || "",
					}}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteCategory}
				title="Delete Category"
				description={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
			/>
		</Card>
	);
}
