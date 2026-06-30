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
import { PriceInput } from "@/components/ui/price-input";
import { NumericInput } from "@/components/ui/numeric-input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
	Upload,
	X,
	Star,
	ChevronRight,
	ChevronLeft,
	Check,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	ProductMobilePreview,
	type ProductPreviewData,
} from "@/components/store/product-mobile-preview";
import type {
	ProductWithDetails,
	ProductJointName,
	Currency,
	RentTerm,
	UploadProgress,
	UploadError,
	ProductFormModalProps,
} from "@/types/store-types";

// Schema for product form validation
const productSchema = z.object({
	category_id: z
		.union([z.number(), z.string()])
		.transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
		.pipe(z.number().min(1, "Category is required")),
	subcategory_id: z
		.union([z.number(), z.string()])
		.transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
		.pipe(z.number().min(1, "Subcategory is required")),
	name: z.string().min(1, "Product name is required"),
	name_ar: z.string().min(1, "Arabic product name is required"),
	description: z.string().optional(),
	description_ar: z.string().optional(),
	price: z
		.union([z.string(), z.number()])
		.transform((val) => {
			if (typeof val === "string") {
				const num = parseFloat(val);
				return isNaN(num) ? 0 : num;
			}
			return val;
		})
		.pipe(z.number().min(0, "Price must be positive")),
	discounted_price: z
		.union([z.string(), z.number()])
		.transform((val) => {
			if (typeof val === "string") {
				const num = parseFloat(val);
				return isNaN(num) ? 0 : num;
			}
			return val;
		})
		.pipe(z.number().min(0))
		.optional(),
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
	stock: z
		.union([z.string(), z.number()])
		.transform((val) => {
			if (typeof val === "string") {
				const num = parseInt(val);
				return isNaN(num) ? 0 : num;
			}
			return val;
		})
		.pipe(z.number().min(0, "Stock must be non-negative")),
	is_best_seller: z.boolean(),
	is_featured: z.boolean(),
	is_available: z.boolean(),
	is_oos: z.boolean(),
	is_for_rent: z.boolean(),
	rent_term: z.enum(["per_day", "per_week", "per_month"]).optional().nullable(),
	tags: z.array(z.string()),
	joint_ids: z.array(z.number()),
	images: z.array(
		z.object({
			url: z.string(),
			is_main: z.boolean(),
		})
	),
});

// Step-specific validation schemas
const step1Schema = z.object({
	category_id: z
		.union([z.number(), z.string()])
		.transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
		.pipe(z.number().min(1, "Category is required")),
	subcategory_id: z
		.union([z.number(), z.string()])
		.transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
		.pipe(z.number().min(1, "Subcategory is required")),
	name: z.string().min(1, "Product name is required"),
	name_ar: z.string().min(1, "Arabic product name is required"),
	description: z.string().optional(),
	description_ar: z.string().optional(),
	price: z
		.union([z.string(), z.number()])
		.transform((val) => {
			if (typeof val === "string") {
				const num = parseFloat(val);
				return isNaN(num) ? 0 : num;
			}
			return val;
		})
		.pipe(z.number().min(0, "Price must be positive")),
	discounted_price: z
		.union([z.string(), z.number()])
		.transform((val) => {
			if (typeof val === "string") {
				const num = parseFloat(val);
				return isNaN(num) ? 0 : num;
			}
			return val;
		})
		.pipe(z.number().min(0))
		.optional(),
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
	stock: z
		.union([z.string(), z.number()])
		.transform((val) => {
			if (typeof val === "string") {
				const num = parseInt(val);
				return isNaN(num) ? 0 : num;
			}
			return val;
		})
		.pipe(z.number().min(0, "Stock must be non-negative")),
});

const step2Schema = z.object({
	is_best_seller: z.boolean(),
	is_featured: z.boolean(),
	is_available: z.boolean(),
	is_oos: z.boolean(),
	is_for_rent: z.boolean(),
	rent_term: z.enum(["per_day", "per_week", "per_month"]).optional().nullable(),
	tags: z.array(z.string()),
	joint_ids: z.array(z.number()),
});

const step3Schema = z.object({
	images: z
		.array(
			z.object({
				url: z.string(),
				is_main: z.boolean(),
			})
		)
		.min(1, "At least one image is required"),
});

// Step 4 is just for preview - no additional validation needed
const step4Schema = z.object({});

type ProductFormData = z.infer<typeof productSchema>;

// Step indicator component
const StepIndicator = ({
	currentStep,
	totalSteps,
}: {
	currentStep: number;
	totalSteps: number;
}) => {
	return (
		<div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8">
			{Array.from({ length: totalSteps }, (_, index) => (
				<div key={index} className="flex items-center">
					<div
						className={cn(
							"w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
							currentStep > index + 1
								? "bg-primary text-primary-foreground"
								: currentStep === index + 1
									? "bg-primary text-primary-foreground ring-2 ring-primary/20"
									: "bg-muted text-muted-foreground"
						)}
					>
						{currentStep > index + 1 ? (
							<Check className="w-4 h-4" />
						) : (
							index + 1
						)}
					</div>
					{index < totalSteps - 1 && (
						<div
							className={cn(
								"w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-all duration-300",
								currentStep > index + 1 ? "bg-primary" : "bg-muted"
							)}
						/>
					)}
				</div>
			))}
		</div>
	);
};

// Step 1: Basic Information
const BasicInformationStep = ({
	form,
	categories,
	subcategories,
}: {
	form: any;
	categories: { id: number; name: string; name_ar: string }[];
	subcategories: {
		id: number;
		category_id: number;
		name: string;
		name_ar: string;
	}[];
}) => {
	const categoryId = form.watch("category_id");
	const categoryIdNum =
		typeof categoryId === "string"
			? parseInt(categoryId, 10)
			: Number(categoryId);

	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Basic Information</h3>

				{/* Category and Subcategory */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="category_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Category *</FormLabel>
								<Select
									onValueChange={(val) => {
										field.onChange(parseInt(val, 10) || 0);
										form.setValue("subcategory_id", 0);
									}}
									value={field.value ? String(field.value) : ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{categories.map((cat) => (
											<SelectItem key={cat.id} value={String(cat.id)}>
												{cat.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="subcategory_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Subcategory *</FormLabel>
								<Select
									onValueChange={(val) =>
										field.onChange(parseInt(val, 10) || 0)
									}
									value={field.value ? String(field.value) : ""}
									disabled={!categoryIdNum || categoryIdNum < 1}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select subcategory" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{subcategories.map((sub) => (
											<SelectItem key={sub.id} value={String(sub.id)}>
												{sub.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Product Name - Side by side */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product Name (English)</FormLabel>
								<FormControl>
									<Input placeholder="Enter product name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="name_ar"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product Name (Arabic)</FormLabel>
								<FormControl>
									<Input placeholder="أدخل اسم المنتج" {...field} dir="rtl" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Description - Side by side */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description (English)</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Enter product description"
										className="resize-none min-h-[100px]"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description_ar"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description (Arabic)</FormLabel>
								<FormControl>
									<Textarea
										placeholder="أدخل وصف المنتج"
										className="resize-none min-h-[100px]"
										dir="rtl"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Price and Currency - Side by side */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Price</FormLabel>
								<FormControl>
									<PriceInput
										placeholder="Enter price"
										value={field.value}
										onChange={field.onChange}
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
								<Select onValueChange={field.onChange} value={field.value}>
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

				{/* Discounted Price and Stock - Side by side */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="discounted_price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Discounted Price (Optional)</FormLabel>
								<FormControl>
									<PriceInput
										placeholder="Enter discounted price"
										value={field.value}
										onChange={field.onChange}
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
									<NumericInput
										placeholder="Enter stock quantity"
										value={field.value}
										onChange={field.onChange}
										allowDecimals={false}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
};

// Step 2: Joints, Labels, and Tags
const DetailsStep = ({
	form,
	joints,
}: {
	form: any;
	joints: ProductJointName[];
}) => {
	const [newTag, setNewTag] = useState("");

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
			currentTags.filter((tag: string) => tag !== tagToRemove)
		);
	};

	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			{/* Body Joints */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Body Joints</h3>
				<FormField
					control={form.control}
					name="joint_ids"
					render={({ field }) => (
						<FormItem>
							<FormDescription>
								Select body joints this product is related to
							</FormDescription>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
															field.value.filter(
																(id: number) => id !== joint.id
															)
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

			{/* Special Labels */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Special Labels</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
						name="is_oos"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Out of Stock</FormLabel>
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
										onCheckedChange={(checked) => {
											field.onChange(checked);
											// Reset rent_term when "for rent" is unchecked
											if (!checked) {
												form.setValue("rent_term", null);
											}
										}}
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
									value={field.value || undefined}
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

			{/* Tags */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Tags</h3>
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
					{form.watch("tags").map((tag: string, index: number) => (
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
		</div>
	);
};

// Validation Error Display Component
const ValidationErrorDisplay = ({ errors }: { errors: string[] }) => {
	if (errors.length === 0) return null;

	return (
		<Alert variant="destructive" className="mb-4">
			<AlertTriangle className="h-4 w-4" />
			<AlertDescription>
				<div className="font-medium mb-2">Please fix the following errors:</div>
				<ul className="list-disc list-inside space-y-1">
					{errors.map((error, index) => (
						<li key={index} className="text-sm">
							{error}
						</li>
					))}
				</ul>
			</AlertDescription>
		</Alert>
	);
};

// Step 4: Preview
const PreviewStep = ({ form }: { form: any }) => {
	// Watch form values to ensure preview updates when user navigates back
	const watchedValues = form.watch();

	// Map form data to preview data
	const formData = watchedValues;
	const previewData: ProductPreviewData = {
		name: formData.name || "Product Name",
		name_ar: formData.name_ar || "اسم المنتج",
		description: formData.description,
		description_ar: formData.description_ar,
		price:
			typeof formData.price === "string"
				? parseFloat(formData.price) || 0
				: formData.price || 0,
		discounted_price:
			typeof formData.discounted_price === "string"
				? parseFloat(formData.discounted_price) || undefined
				: formData.discounted_price,
		currency: formData.currency || "EGP",
		is_best_seller: Boolean(formData.is_best_seller),
		is_featured: Boolean(formData.is_featured),
		is_available: formData.is_available !== false,
		is_oos: Boolean(formData.is_oos),
		is_for_rent: Boolean(formData.is_for_rent),
		images: formData.images || [],
	};

	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Mobile App Preview</h3>
				<p className="text-sm text-muted-foreground">
					This is how your product will appear in the mobile app. You can toggle
					between English and Arabic to see both versions. If you need to make
					changes, use the "Previous" button to go back to earlier steps.
				</p>
				<div className="flex justify-center">
					<ProductMobilePreview data={previewData} />
				</div>
			</div>
		</div>
	);
};

// Step 3: Images
const ImagesStep = ({ form }: { form: any }) => {
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null
	);
	const { toast } = useToast();

	const uploadImage = async (file: File) => {
		const formData = new FormData();
		formData.append("files", file);

		const response = await fetch("/api/protected/store/upload-images", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to upload image");
		}

		const result = await response.json();
		return result.data[0].url;
	};

	/**
	 * Uploads multiple images sequentially using reduce() with async/await
	 * This ensures each upload completes before starting the next one
	 */
	const uploadImagesSequentially = async (files: File[]): Promise<string[]> => {
		const results: string[] = [];
		const errors: UploadError[] = [];

		// Use reduce with async/await for sequential processing
		await files.reduce(async (previousPromise, file, index) => {
			// Wait for the previous upload to complete
			await previousPromise;

			// Update progress
			setUploadProgress({
				current: index + 1,
				total: files.length,
				currentFileName: file.name,
			});

			try {
				// Upload current file
				const imageUrl = await uploadImage(file);
				results.push(imageUrl);
			} catch (error) {
				// Collect errors but continue with other files
				errors.push({
					fileName: file.name,
					error: error instanceof Error ? error.message : "Upload failed",
				});
			}

			// Return a resolved promise for the next iteration
			return Promise.resolve();
		}, Promise.resolve());

		// If there were any errors, show them to the user
		if (errors.length > 0) {
			const errorMessage = errors
				.map(({ fileName, error }) => `${fileName}: ${error}`)
				.join(", ");

			toast({
				variant: "destructive",
				title: "Some uploads failed",
				description: `Failed to upload: ${errorMessage}`,
			});
		}

		return results;
	};

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		// Convert FileList to Array for easier handling
		const fileArray = Array.from(files);

		// Validate file count (reasonable limit to prevent abuse)
		const maxFiles = 10;
		if (fileArray.length > maxFiles) {
			toast({
				variant: "destructive",
				title: "Too many files",
				description: `Please select no more than ${maxFiles} images at once`,
			});
			return;
		}

		// Validate file types and sizes
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		const maxFileSize = 5 * 1024 * 1024; // 5MB

		for (const file of fileArray) {
			if (!allowedTypes.includes(file.type)) {
				toast({
					variant: "destructive",
					title: "Invalid file type",
					description: `${file.name} is not a supported image type. Please use JPEG, PNG, or WebP.`,
				});
				return;
			}

			if (file.size > maxFileSize) {
				toast({
					variant: "destructive",
					title: "File too large",
					description: `${file.name} exceeds the 5MB size limit.`,
				});
				return;
			}
		}

		try {
			setUploading(true);
			setUploadProgress({
				current: 0,
				total: fileArray.length,
				currentFileName: "",
			});

			// Upload images sequentially
			const imageUrls = await uploadImagesSequentially(fileArray);

			// Add uploaded images to form
			const currentImages = form.getValues("images");
			const isFirstImage = currentImages.length === 0;

			const newImages = imageUrls.map((url, index) => ({
				url,
				is_main: isFirstImage && index === 0, // Only the first image of the first batch is main
			}));

			form.setValue("images", [...currentImages, ...newImages]);

			// Only show success message if we have uploaded images
			if (imageUrls.length > 0) {
				toast({
					title: "Success",
					description: `${imageUrls.length} image(s) uploaded successfully`,
				});
			}
		} catch (error) {
			// This catch block handles any unexpected errors during the upload process
			toast({
				variant: "destructive",
				title: "Upload Error",
				description:
					error instanceof Error ? error.message : "Failed to upload images",
			});
		} finally {
			setUploading(false);
			setUploadProgress(null);
			// Reset input value to allow uploading the same files again
			if (event.target) {
				event.target.value = "";
			}
		}
	};

	const removeImage = (index: number) => {
		const currentImages = form.getValues("images");
		const newImages = currentImages.filter((_: any, i: number) => i !== index);

		if (newImages.length > 0 && currentImages[index].is_main) {
			newImages[0].is_main = true;
		}

		form.setValue("images", newImages);
	};

	const setMainImage = (index: number) => {
		const currentImages = form.getValues("images");
		const newImages = currentImages.map((img: any, i: number) => ({
			...img,
			is_main: i === index,
		}));
		form.setValue("images", newImages);
	};

	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Product Images</h3>
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => document.getElementById("image-upload")?.click()}
							disabled={uploading}
						>
							<Upload className="h-4 w-4 mr-2" />
							{uploading ? "Uploading..." : "Upload Images (Multiple)"}
						</Button>
						<input
							id="image-upload"
							type="file"
							accept="image/*"
							multiple
							onChange={handleImageUpload}
							className="hidden"
						/>
						{uploading && uploadProgress && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<div className="w-32 bg-muted rounded-full h-2">
									<div
										className="bg-primary h-2 rounded-full transition-all duration-300"
										style={{
											width: `${
												(uploadProgress.current / uploadProgress.total) * 100
											}%`,
										}}
									/>
								</div>
								<span>
									{uploadProgress.current}/{uploadProgress.total}
								</span>
								{uploadProgress.currentFileName && (
									<span className="text-xs min-w-0 truncate">
										({uploadProgress.currentFileName})
									</span>
								)}
							</div>
						)}
					</div>

					{/* Validation message for images */}
					{form.watch("images").length === 0 && (
						<div className="text-sm text-destructive">
							⚠️ At least one image is required to complete this step.
						</div>
					)}

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
						{form.watch("images").map((image: any, index: number) => (
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
		</div>
	);
};

export const ProductFormModal = ({
	open,
	onOpenChange,
	onSuccess,
	title,
	description,
	product,
}: ProductFormModalProps) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [joints, setJoints] = useState<ProductJointName[]>([]);
	const [categories, setCategories] = useState<
		{ id: number; name: string; name_ar: string }[]
	>([]);
	const [subcategories, setSubcategories] = useState<
		{ id: number; category_id: number; name: string; name_ar: string }[]
	>([]);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const { toast } = useToast();

	const form = useForm({
		resolver: zodResolver(productSchema),
		defaultValues: {
			category_id: 0,
			subcategory_id: 0,
			name: "",
			name_ar: "",
			description: "",
			description_ar: "",
			price: "",
			discounted_price: "",
			currency: "EGP" as const,
			stock: "",
			is_best_seller: false,
			is_featured: false,
			is_available: true,
			is_oos: false,
			is_for_rent: false,
			rent_term: null,
			tags: [],
			joint_ids: [],
			images: [],
		},
		mode: "onChange",
	});

	const watchedCategoryId = form.watch("category_id");

	// Step validation functions
	const validateStep1 = async () => {
		const step1Data = {
			category_id: form.getValues("category_id"),
			subcategory_id: form.getValues("subcategory_id"),
			name: form.getValues("name"),
			name_ar: form.getValues("name_ar"),
			description: form.getValues("description"),
			description_ar: form.getValues("description_ar"),
			price: form.getValues("price"),
			discounted_price: form.getValues("discounted_price"),
			currency: form.getValues("currency"),
			stock: form.getValues("stock"),
		};

		try {
			step1Schema.parse(step1Data);
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errors: string[] = [];
				error.issues.forEach((err) => {
					const fieldName = String(err.path[0] ?? "");
					form.setError(fieldName as any, {
						type: "manual",
						message: err.message,
					});
					errors.push(`${fieldName}: ${err.message}`);
				});
				setValidationErrors(errors);
			}
			return false;
		}
	};

	const validateStep2 = async () => {
		const isForRent = form.getValues("is_for_rent");
		const rentTermValue = form.getValues("rent_term");

		const step2Data = {
			is_best_seller: form.getValues("is_best_seller"),
			is_featured: form.getValues("is_featured"),
			is_available: form.getValues("is_available"),
			is_oos: form.getValues("is_oos"),
			is_for_rent: isForRent,
			rent_term: isForRent ? rentTermValue : null,
			tags: form.getValues("tags"),
			joint_ids: form.getValues("joint_ids"),
		};

		try {
			step2Schema.parse(step2Data);
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errors: string[] = [];
				error.issues.forEach((err) => {
					const fieldName = String(err.path[0] ?? "");
					const fieldLabel =
						fieldName === "rent_term" ? "Rent Term" : fieldName;
					form.setError(fieldName as any, {
						type: "manual",
						message: err.message,
					});
					errors.push(`${fieldLabel}: ${err.message}`);
				});
				setValidationErrors(errors);
			}
			return false;
		}
	};

	const validateStep3 = async () => {
		const step3Data = {
			images: form.getValues("images"),
		};

		try {
			step3Schema.parse(step3Data);
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errors: string[] = [];
				error.issues.forEach((err) => {
					const fieldName = String(err.path[0] ?? "");
					const fieldLabel =
						fieldName === "images" ? "Product Images" : fieldName;
					form.setError(fieldName as any, {
						type: "manual",
						message: err.message,
					});
					errors.push(`${fieldLabel}: ${err.message}`);
				});
				setValidationErrors(errors);
			}
			return false;
		}
	};

	const validateStep4 = async () => {
		// Step 4 is just preview, no validation needed
		return true;
	};

	useEffect(() => {
		if (open) {
			fetchJoints();
			fetchCategories();
			setCurrentStep(1);
			setValidationErrors([]);

			if (product) {
				form.reset({
					category_id: product.category_id ?? 0,
					subcategory_id: product.subcategory_id ?? 0,
					name: product.name,
					name_ar: product.name_ar,
					description: product.description || "",
					description_ar: product.description_ar || "",
					price: product.price,
					discounted_price: product.discounted_price || 0,
					currency: product.currency,
					stock: product.stock,
					is_best_seller: product.is_best_seller,
					is_featured: product.is_featured,
					is_available: product.is_available,
					is_oos: product.is_oos,
					is_for_rent: product.is_for_rent,
					rent_term: product.rent_term,
					tags: product.tags || [],
					joint_ids: product.joints?.map((j) => j.id) || [],
					images:
						product.product_images?.map((img) => ({
							url: img.image_url,
							is_main: img.is_main,
						})) || [],
				});
				const catId = product.category_id;
				if (catId) fetchSubcategoriesForCategory(catId);
			} else {
				form.reset({
					category_id: 0,
					subcategory_id: 0,
					name: "",
					name_ar: "",
					description: "",
					description_ar: "",
					price: "",
					discounted_price: "",
					currency: "EGP",
					stock: "",
					is_best_seller: false,
					is_featured: false,
					is_available: true,
					is_oos: false,
					is_for_rent: false,
					rent_term: null,
					tags: [],
					joint_ids: [],
					images: [],
				});
				setSubcategories([]);
			}
		}
	}, [open, product, form]);

	const fetchJoints = async () => {
		try {
			const response = await fetch("/api/protected/store/joints");
			if (response.ok) {
				const result = await response.json();
				setJoints(result.data);
			}
		} catch (error) {
			// Silently handle joint fetch errors
		}
	};

	const fetchCategories = async () => {
		try {
			const response = await fetch("/api/protected/store/categories");
			if (response.ok) {
				const result = await response.json();
				setCategories(result.data ?? []);
			}
		} catch (error) {
			// Silently handle category fetch errors
		}
	};

	const fetchSubcategoriesForCategory = async (categoryId: number) => {
		if (!categoryId) {
			setSubcategories([]);
			return;
		}
		try {
			const response = await fetch(
				`/api/protected/store/categories/${categoryId}/subcategories`
			);
			if (response.ok) {
				const result = await response.json();
				setSubcategories(result.data ?? []);
			} else {
				setSubcategories([]);
			}
		} catch (error) {
			setSubcategories([]);
		}
	};

	useEffect(() => {
		const catId =
			typeof watchedCategoryId === "string"
				? parseInt(watchedCategoryId, 10)
				: Number(watchedCategoryId);
		if (catId > 0) {
			fetchSubcategoriesForCategory(catId);
		} else {
			setSubcategories([]);
		}
	}, [watchedCategoryId]);

	const nextStep = async () => {
		if (currentStep < 4) {
			let isValid = false;

			// Clear previous errors before validation
			form.clearErrors();
			setValidationErrors([]);

			// Validate current step before proceeding
			switch (currentStep) {
				case 1:
					isValid = await validateStep1();
					break;
				case 2:
					isValid = await validateStep2();
					break;
				case 3:
					isValid = await validateStep3();
					break;
				default:
					isValid = true;
			}

			if (isValid) {
				setCurrentStep(currentStep + 1);
			} else {
				toast({
					variant: "destructive",
					title: "Validation Error",
					description: "Please complete all required fields before proceeding.",
				});
			}
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			setValidationErrors([]);
			setCurrentStep(currentStep - 1);
		}
	};

	const onSubmit = async (data: z.infer<typeof productSchema>) => {
		// Validate step 3 (images) before submission
		const isStep3Valid = await validateStep3();
		if (!isStep3Valid) {
			toast({
				variant: "destructive",
				title: "Validation Error",
				description: "Please upload at least one image before submitting.",
			});
			return;
		}

		try {
			setLoading(true);

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

			const result = await response.json();

			// Show warnings if any
			if (result.warnings && result.warnings.length > 0) {
				toast({
					title: "Partial Success",
					description: `Product ${
						product ? "updated" : "created"
					} with warnings: ${result.warnings.join(", ")}`,
					variant: "destructive",
				});
			} else {
				toast({
					title: "Success",
					description: `Product ${
						product ? "updated" : "created"
					} successfully`,
				});
			}

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

	// Dedicated handler for the submit button
	const handleSubmitButtonClick = async (e?: React.MouseEvent) => {
		// Prevent any default behavior
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		// Prevent double-clicks
		if (loading) {
			return;
		}

		try {
			// Clear previous validation errors
			setValidationErrors([]);

			// Check if form is valid first
			const isValid = await form.trigger();

			if (!isValid) {
				const formErrors = form.formState.errors;
				const errorMessages: string[] = [];

				// Collect form errors with user-friendly labels
				Object.entries(formErrors).forEach(([key, error]) => {
					if (error?.message) {
						const fieldLabel =
							{
								category_id: "Category",
								subcategory_id: "Subcategory",
								name: "Product Name (English)",
								name_ar: "Product Name (Arabic)",
								price: "Price",
								currency: "Currency",
								stock: "Stock Quantity",
								rent_term: "Rent Term",
								images: "Product Images",
							}[key] || key;

						errorMessages.push(`${fieldLabel}: ${error.message}`);
					}
				});

				setValidationErrors(errorMessages);
				toast({
					variant: "destructive",
					title: "Validation Error",
					description: "Please fix the form errors before submitting.",
				});
				return;
			}

			// Use handleSubmit which properly validates and transforms the data
			const submitFn = form.handleSubmit(onSubmit);
			await submitFn();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to submit form. Please try again.",
			});
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<BasicInformationStep
						form={form}
						categories={categories}
						subcategories={subcategories}
					/>
				);
			case 2:
				return <DetailsStep form={form} joints={joints} />;
			case 3:
				return <ImagesStep form={form} />;
			case 4:
				return <PreviewStep form={form} />;
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"max-h-[90vh] overflow-y-auto",
					currentStep === 4 ? "max-w-6xl" : "max-w-4xl"
				)}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
					<StepIndicator currentStep={currentStep} totalSteps={4} />
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							// Prevent default form submission - we'll handle this manually
						}}
						className="space-y-6"
					>
						<ValidationErrorDisplay errors={validationErrors} />
						{renderStep()}

						<div className="flex justify-between pt-6 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={prevStep}
								disabled={currentStep === 1}
								className={cn(
									"transition-all duration-200",
									currentStep === 1 ? "opacity-50" : "hover:scale-105"
								)}
							>
								<ChevronLeft className="h-4 w-4 mr-2" />
								Previous
							</Button>

							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									disabled={loading}
								>
									Cancel
								</Button>

								{currentStep < 4 ? (
									<Button
										type="button"
										onClick={nextStep}
										className="transition-all duration-200 hover:scale-105"
									>
										{currentStep === 3 ? "Preview" : "Next"}
										<ChevronRight className="h-4 w-4 ml-2" />
									</Button>
								) : (
									<Button
										type="button"
										disabled={loading}
										className="transition-all duration-200 hover:scale-105"
										onClick={handleSubmitButtonClick}
									>
										{loading
											? "Saving..."
											: `${product ? "Update" : "Create"} Product`}
									</Button>
								)}
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
