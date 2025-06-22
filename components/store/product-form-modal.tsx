"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Star } from "lucide-react";
import type {
	ProductWithDetails,
	Category,
	Joint,
	Currency,
	RentTerm,
} from "@/types/store-types";

// Schema for product form validation
const productSchema = z.object({
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	discounted_price: z.number().min(0).optional(),
	currency: z.enum([
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
	]),
	stock: z.number().min(0, "Stock must be non-negative"),
	category_id: z.number().min(1, "Category is required"),
	is_best_seller: z.boolean(),
	is_featured: z.boolean(),
	is_available: z.boolean(),
	is_for_rent: z.boolean(),
	rent_term: z.enum(["per_day", "per_week", "per_month"]).optional(),
	tags: z.array(z.string()),
	joint_ids: z.array(z.number()),
	images: z.array(
		z.object({
			url: z.string(),
			is_main: z.boolean(),
		})
	),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	title: string;
	description: string;
	product?: ProductWithDetails;
}

export function ProductFormModal({
	open,
	onOpenChange,
	onSuccess,
	title,
	description,
	product,
}: ProductFormModalProps) {
	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [joints, setJoints] = useState<Joint[]>([]);
	const [newTag, setNewTag] = useState("");
	const [uploading, setUploading] = useState(false);
	const { toast } = useToast();

	const form = useForm({
		resolver: zodResolver(productSchema),
		defaultValues: {
			name: "",
			description: "",
			price: 0,
			discounted_price: 0,
			currency: "EGP" as const,
			stock: 0,
			category_id: 0,
			is_best_seller: false,
			is_featured: false,
			is_available: true,
			is_for_rent: false,
			tags: [],
			joint_ids: [],
			images: [],
		},
	});

	useEffect(() => {
		if (open) {
			fetchCategories();
			fetchJoints();

			if (product) {
				// Populate form with existing product data
				form.reset({
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
					rent_term: product.rent_term,
					tags: product.tags || [],
					joint_ids: product.joints?.map((j) => j.id) || [],
					images:
						product.images?.map((img) => ({
							url: img.image_url,
							is_main: img.is_main,
						})) || [],
				});
			} else {
				form.reset({
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
					tags: [],
					joint_ids: [],
					images: [],
				});
			}
		}
	}, [open, product, form]);

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

			const currentImages = form.getValues("images");
			const isFirstImage = currentImages.length === 0;

			form.setValue("images", [
				...currentImages,
				{ url: imageUrl, is_main: isFirstImage },
			]);

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
		const currentImages = form.getValues("images");
		const newImages = currentImages.filter((_, i) => i !== index);

		// If we removed the main image, make the first remaining image main
		if (newImages.length > 0 && currentImages[index].is_main) {
			newImages[0].is_main = true;
		}

		form.setValue("images", newImages);
	};

	const setMainImage = (index: number) => {
		const currentImages = form.getValues("images");
		const newImages = currentImages.map((img, i) => ({
			...img,
			is_main: i === index,
		}));
		form.setValue("images", newImages);
	};

	const addTag = () => {
		if (!newTag.trim()) return;

		const currentTags = form.getValues("tags");
		if (!currentTags.includes(newTag.trim())) {
			form.setValue("tags", [...currentTags, newTag.trim()]);
		}
		setNewTag("");
	};

	const removeTag = (tagToRemove: string) => {
		const currentTags = form.getValues("tags");
		form.setValue(
			"tags",
			currentTags.filter((tag) => tag !== tagToRemove)
		);
	};

	const onSubmit = async (data: z.infer<typeof productSchema>) => {
		try {
			setLoading(true);

			// Clean up data - remove empty discounted_price
			const submitData = {
				...data,
				discounted_price: data.discounted_price || undefined,
				rent_term: data.is_for_rent ? data.rent_term : undefined,
			};

			const url = product
				? `/api/protected/store/products/${product.id}`
				: "/api/protected/store/products";

			const method = product ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(submitData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save product");
			}

			toast({
				title: "Success",
				description: `Product ${product ? "updated" : "created"} successfully`,
			});

			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to save product",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Basic Information */}
							<div className="space-y-4">
								<h3 className="font-semibold">Basic Information</h3>

								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Product Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter product name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Enter product description"
													className="resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="category_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Category</FormLabel>
											<Select
												onValueChange={(value) =>
													field.onChange(parseInt(value))
												}
												value={field.value.toString()}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{categories.map((category) => (
														<SelectItem
															key={category.id}
															value={category.id.toString()}
														>
															{category.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Pricing */}
							<div className="space-y-4">
								<h3 className="font-semibold">Pricing</h3>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="price"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Price</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														min="0"
														placeholder="0.00"
														{...field}
														onChange={(e) =>
															field.onChange(parseFloat(e.target.value) || 0)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="currency"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Currency</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
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
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="discounted_price"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Discounted Price (Optional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													placeholder="0.00"
													{...field}
													onChange={(e) =>
														field.onChange(parseFloat(e.target.value) || 0)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="stock"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Stock Quantity</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													placeholder="0"
													{...field}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value) || 0)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Product Options */}
						<div className="space-y-4">
							<h3 className="font-semibold">Product Options</h3>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<FormField
									control={form.control}
									name="is_available"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Available</FormLabel>
											</div>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="is_featured"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Featured</FormLabel>
											</div>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="is_best_seller"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Best Seller</FormLabel>
											</div>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="is_for_rent"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>For Rent</FormLabel>
											</div>
										</FormItem>
									)}
								/>
							</div>

							{form.watch("is_for_rent") && (
								<FormField
									control={form.control}
									name="rent_term"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Rent Term</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-[200px]">
														<SelectValue placeholder="Select rent term" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="per_day">Per Day</SelectItem>
													<SelectItem value="per_week">Per Week</SelectItem>
													<SelectItem value="per_month">Per Month</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>

						{/* Body Joints */}
						<div className="space-y-4">
							<h3 className="font-semibold">Body Joints</h3>
							<FormField
								control={form.control}
								name="joint_ids"
								render={({ field }) => (
									<FormItem>
										<FormDescription>
											Select body joints this product is related to
										</FormDescription>
										<div className="grid grid-cols-3 gap-2">
											{joints.map((joint) => (
												<FormItem
													key={joint.id}
													className="flex flex-row items-start space-x-3 space-y-0"
												>
													<FormControl>
														<Checkbox
															checked={field.value.includes(joint.id)}
															onCheckedChange={(checked) => {
																if (checked) {
																	field.onChange([...field.value, joint.id]);
																} else {
																	field.onChange(
																		field.value.filter((id) => id !== joint.id)
																	);
																}
															}}
														/>
													</FormControl>
													<FormLabel className="text-sm font-normal">
														{joint.name}
													</FormLabel>
												</FormItem>
											))}
										</div>
									</FormItem>
								)}
							/>
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
								{form.watch("tags").map((tag, index) => (
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
										onClick={() =>
											document.getElementById("image-upload")?.click()
										}
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
									{form.watch("images").map((image, index) => (
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
								onClick={() => onOpenChange(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || uploading}>
								{loading
									? "Saving..."
									: `${product ? "Update" : "Create"} Product`}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
