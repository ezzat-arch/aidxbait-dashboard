"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	ArrowDown,
	ArrowUp,
	Check,
	ChevronsUpDown,
	Loader2,
	Plus,
	Trash2,
	Upload,
	X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CustomTextEditor } from "@/components/blogs/custom-text-editor";
import type {
	PostDetail,
	PostLanguage,
	PostPayload,
	PostTranslationDetail,
	PostTranslationPayload,
	ShopifyProductOption,
} from "@/types/blog-types";

const hasArabicContent = (ar: {
	title: string;
	slug: string;
	content: string;
	items: { body: string; image: string; video: string; link: string }[];
}) =>
	!!ar.title.trim() ||
	!!ar.slug.trim() ||
	!!ar.content.trim() ||
	ar.items.some(
		(i) => i.body.trim() || i.image.trim() || i.video.trim() || i.link.trim()
	);

const itemSchema = z.object({
	body: z.string(),
	image: z.string(),
	video: z.string(),
	link: z.string(),
});

const translationSchema = z.object({
	title: z.string(),
	slug: z.string(),
	content: z.string(),
	excerpt: z.string(),
	meta_title: z.string(),
	meta_description: z.string(),
	items: z.array(itemSchema),
});

const shopifyProductSchema = z.object({
	id: z.string().nullable(),
	handle: z.string(),
	title: z.string(),
	image_url: z.string().nullable(),
	price_amount: z.string().nullable(),
	currency_code: z.string().nullable(),
	available_for_sale: z.boolean().optional(),
});

const blogFormSchema = z
	.object({
		status: z.enum(["draft", "published", "archived"]),
		featured_image: z.string(),
		shopify_products: z.array(shopifyProductSchema),
		en: translationSchema,
		ar: translationSchema,
	})
	.superRefine((values, ctx) => {
		// English translation is always required
		if (!values.en.title.trim()) {
			ctx.addIssue({
				code: "custom",
				path: ["en", "title"],
				message: "Title is required",
			});
		}
		if (!values.en.slug.trim()) {
			ctx.addIssue({
				code: "custom",
				path: ["en", "slug"],
				message: "Slug is required",
			});
		}
		if (!values.en.content.trim()) {
			ctx.addIssue({
				code: "custom",
				path: ["en", "content"],
				message: "Content is required",
			});
		}

		// Every English content block needs a body.
		values.en.items.forEach((item, i) => {
			if (!item.body.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["en", "items", i, "body"],
					message: "Block body is required",
				});
			}
		});

		// Arabic is optional, but once any of title/slug/content is filled the
		// other two are required as well.
		const arStarted = hasArabicContent(values.ar);
		if (arStarted) {
			if (!values.ar.title.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["ar", "title"],
					message: "Arabic title is required",
				});
			}
			if (!values.ar.slug.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["ar", "slug"],
					message: "Arabic slug is required",
				});
			}
			if (!values.ar.content.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["ar", "content"],
					message: "Arabic content is required",
				});
			}
			values.ar.items.forEach((item, i) => {
				if (!item.body.trim()) {
					ctx.addIssue({
						code: "custom",
						path: ["ar", "items", i, "body"],
						message: "Block body is required",
					});
				}
			});
		}
	});

type BlogFormValues = z.infer<typeof blogFormSchema>;

/** lowercase, trim, spaces/underscores -> "-", keep letters/digits/dashes (Arabic-safe), collapse repeats */
const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[\s_]+/g, "-")
		.replace(/[^\p{L}\p{N}-]+/gu, "")
		.replace(/-+/g, "-");

const uploadImage = async (file: File): Promise<string> => {
	const formData = new FormData();
	formData.append("files", file);

	const res = await fetch("/api/protected/blogs/upload-images", {
		method: "POST",
		body: formData,
	});

	if (!res.ok) {
		const e = await res.json().catch(() => ({}));
		throw new Error(e.error || "Failed to upload image");
	}

	const result = await res.json();
	return result.data[0].url;
};

const toTranslationValues = (translation?: PostTranslationDetail) => ({
	title: translation?.title ?? "",
	slug: translation?.slug ?? "",
	content: translation?.content ?? "",
	excerpt: translation?.excerpt ?? "",
	meta_title: translation?.meta_title ?? "",
	meta_description: translation?.meta_description ?? "",
	items: (translation?.items ?? []).map((item) => ({
		body: item.body,
		image: item.image ?? "",
		video: item.video ?? "",
		link: item.link ?? "",
	})),
});

interface TranslationTabProps {
	form: UseFormReturn<BlogFormValues>;
	language: PostLanguage;
	slugTouchedRef: React.MutableRefObject<boolean>;
}

function TranslationTab({ form, language, slugTouchedRef }: TranslationTabProps) {
	const isRtl = language === "ar";
	const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(
		null
	);
	const { toast } = useToast();

	const itemsArray = useFieldArray({
		control: form.control,
		name: `${language}.items`,
	});

	const handleItemImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setUploadingItemIndex(index);
			const url = await uploadImage(file);
			form.setValue(`${language}.items.${index}.image`, url, {
				shouldDirty: true,
			});
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Upload Error",
				description:
					err instanceof Error ? err.message : "Failed to upload image",
			});
		} finally {
			setUploadingItemIndex(null);
			if (event.target) {
				event.target.value = "";
			}
		}
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name={`${language}.title`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input
									placeholder={isRtl ? "أدخل عنوان المقال" : "Enter post title"}
									dir={isRtl ? "rtl" : undefined}
									{...field}
									onChange={(e) => {
										field.onChange(e);
										if (!slugTouchedRef.current) {
											form.setValue(
												`${language}.slug`,
												slugify(e.target.value)
											);
										}
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name={`${language}.slug`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Slug</FormLabel>
							<FormControl>
								<Input
									placeholder={isRtl ? "رابط-المقال" : "post-url-slug"}
									dir={isRtl ? "rtl" : undefined}
									{...field}
									onChange={(e) => {
										slugTouchedRef.current = true;
										field.onChange(e);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name={`${language}.excerpt`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Excerpt</FormLabel>
						<FormControl>
							<Textarea
								placeholder={
									isRtl
										? "ملخص قصير يظهر في قائمة المدونة"
										: "Short summary shown in the blog list"
								}
								className="resize-none min-h-[80px]"
								dir={isRtl ? "rtl" : undefined}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<CustomTextEditor
				name={`${language}.content`}
				control={form.control}
				label="Content"
				language={language}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name={`${language}.meta_title`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Meta title</FormLabel>
							<FormControl>
								<Input
									placeholder={
										isRtl ? "عنوان محركات البحث" : "SEO title (optional)"
									}
									dir={isRtl ? "rtl" : undefined}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name={`${language}.meta_description`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Meta description</FormLabel>
							<FormControl>
								<Input
									placeholder={
										isRtl ? "وصف محركات البحث" : "SEO description (optional)"
									}
									dir={isRtl ? "rtl" : undefined}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="text-sm font-medium">Content blocks</h3>
					<p className="text-xs text-muted-foreground">
						Optional ordered blocks rendered after the main content, each with
						its own text plus an optional image, video and link.
					</p>
				</div>

				{itemsArray.fields.map((itemField, index) => (
					<div
						key={itemField.id}
						className="rounded-lg border border-border p-4 space-y-4"
					>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Block {index + 1}</span>
							<div className="flex items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={index === 0}
									onClick={() => itemsArray.move(index, index - 1)}
								>
									<ArrowUp className="h-4 w-4" />
									<span className="sr-only">Move up</span>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={index === itemsArray.fields.length - 1}
									onClick={() => itemsArray.move(index, index + 1)}
								>
									<ArrowDown className="h-4 w-4" />
									<span className="sr-only">Move down</span>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive"
									onClick={() => itemsArray.remove(index)}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">Remove block</span>
								</Button>
							</div>
						</div>

						<CustomTextEditor
							name={`${language}.items.${index}.body`}
							control={form.control}
							label="Body"
							height={250}
							language={language}
						/>

						<FormField
							control={form.control}
							name={`${language}.items.${index}.image`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Image URL</FormLabel>
									<div className="flex gap-2">
										<FormControl>
											<Input placeholder="https://..." {...field} />
										</FormControl>
										<Button
											type="button"
											variant="outline"
											disabled={uploadingItemIndex === index}
											onClick={() =>
												document
													.getElementById(
														`blog-item-upload-${language}-${index}`
													)
													?.click()
											}
										>
											<Upload className="mr-2 h-4 w-4" />
											{uploadingItemIndex === index
												? "Uploading..."
												: "Upload"}
										</Button>
										<input
											id={`blog-item-upload-${language}-${index}`}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) => handleItemImageUpload(e, index)}
										/>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name={`${language}.items.${index}.video`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Video URL</FormLabel>
										<FormControl>
											<Input
												placeholder="YouTube, Vimeo or video file URL"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`${language}.items.${index}.link`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Link URL</FormLabel>
										<FormControl>
											<Input placeholder="https://..." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				))}

				<Button
					type="button"
					variant="outline"
					onClick={() =>
						itemsArray.append({ body: "", image: "", video: "", link: "" })
					}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add item
				</Button>
			</div>
		</div>
	);
}

interface Props {
	/** undefined = create, otherwise edit */
	post?: PostDetail;
}

export function BlogForm({ post }: Props) {
	const isEdit = post !== undefined;
	const router = useRouter();
	const { toast } = useToast();

	const [loading, setLoading] = useState(false);
	const [uploadingFeatured, setUploadingFeatured] = useState(false);
	const [productOptions, setProductOptions] = useState<ShopifyProductOption[]>(
		[]
	);
	const [productsLoading, setProductsLoading] = useState(false);
	const [productsError, setProductsError] = useState<string | null>(null);
	const [productSearch, setProductSearch] = useState("");
	const [productsOpen, setProductsOpen] = useState(false);
	// The picker fetches lazily: once with an empty search the first time it
	// opens, then debounced per keystroke.
	const productsLoadedRef = useRef(false);

	// Auto-generate the slug from the title until the slug is edited by hand
	// (existing posts keep their slugs untouched).
	const enSlugTouched = useRef(isEdit);
	const arSlugTouched = useRef(isEdit);

	const form = useForm<BlogFormValues>({
		resolver: zodResolver(blogFormSchema),
		defaultValues: {
			status: post?.status ?? "draft",
			featured_image: post?.featured_image ?? "",
			// Seed the picker from the stored snapshots (edit mode).
			shopify_products: (post?.shopify_products ?? []).map((p) => ({
				id: p.shopify_product_id,
				handle: p.handle,
				title: p.title,
				image_url: p.image_url,
				price_amount: p.price_amount,
				currency_code: p.currency_code,
			})),
			en: toTranslationValues(
				post?.translations.find((t) => t.language === "en")
			),
			ar: toTranslationValues(
				post?.translations.find((t) => t.language === "ar")
			),
		},
		mode: "onChange",
	});

	const fetchShopifyProducts = async (search: string) => {
		try {
			setProductsLoading(true);
			setProductsError(null);
			const res = await fetch(
				`/api/protected/blogs/shopify-products?search=${encodeURIComponent(
					search
				)}`
			);
			if (res.ok) {
				const result = await res.json();
				setProductOptions(result.data ?? []);
			} else {
				// Surface the real reason (e.g. "Shopify is not configured (...)")
				// instead of a misleading "No products found".
				const e = await res.json().catch(() => ({}));
				setProductOptions([]);
				setProductsError(e.error || "Failed to fetch products from Shopify");
			}
		} catch {
			setProductOptions([]);
			setProductsError("Failed to fetch products from Shopify");
		} finally {
			setProductsLoading(false);
		}
	};

	// Initial load with an empty search the first time the picker opens.
	useEffect(() => {
		if (productsOpen && !productsLoadedRef.current) {
			productsLoadedRef.current = true;
			fetchShopifyProducts("");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productsOpen]);

	// Debounced search while typing.
	useEffect(() => {
		if (!productsLoadedRef.current) return;
		const timeout = setTimeout(() => {
			fetchShopifyProducts(productSearch.trim());
		}, 300);
		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productSearch]);

	const featuredImage = form.watch("featured_image");
	const selectedProducts = form.watch("shopify_products");

	const handleFeaturedUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setUploadingFeatured(true);
			const url = await uploadImage(file);
			form.setValue("featured_image", url, { shouldDirty: true });
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Upload Error",
				description:
					err instanceof Error ? err.message : "Failed to upload image",
			});
		} finally {
			setUploadingFeatured(false);
			if (event.target) {
				event.target.value = "";
			}
		}
	};

	const toggleProduct = (option: ShopifyProductOption) => {
		const current = form.getValues("shopify_products");
		const exists = current.some((p) => p.handle === option.handle);
		form.setValue(
			"shopify_products",
			exists
				? current.filter((p) => p.handle !== option.handle)
				: [...current, option],
			{ shouldDirty: true }
		);
	};

	const buildTranslation = (
		language: PostLanguage,
		values: BlogFormValues["en"]
	): PostTranslationPayload => ({
		language,
		title: values.title.trim(),
		slug: slugify(values.slug),
		content: values.content,
		excerpt: values.excerpt.trim() || null,
		meta_title: values.meta_title.trim() || null,
		meta_description: values.meta_description.trim() || null,
		items: values.items.map((item) => ({
			body: item.body,
			image: item.image.trim() || null,
			video: item.video.trim() || null,
			link: item.link.trim() || null,
		})),
	});

	const onSubmit = async (data: BlogFormValues) => {
		setLoading(true);
		try {
			const translations = [buildTranslation("en", data.en)];
			const arStarted = hasArabicContent(data.ar);
			if (arStarted) {
				translations.push(buildTranslation("ar", data.ar));
			}

			const payload: PostPayload = {
				status: data.status,
				featured_image: data.featured_image.trim() || null,
				// Display snapshots; display_order = array index server-side.
				shopify_products: data.shopify_products.map((p) => ({
					handle: p.handle,
					shopify_product_id: p.id,
					title: p.title,
					image_url: p.image_url,
					price_amount: p.price_amount,
					currency_code: p.currency_code,
				})),
				translations,
			};

			const url = isEdit
				? `/api/protected/blogs/${post.id}`
				: "/api/protected/blogs";
			const res = await fetch(url, {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to save post");
			}

			const result = await res.json();

			if (result.warnings && result.warnings.length > 0) {
				toast({
					variant: "destructive",
					title: "Partial Success",
					description: `Post ${
						isEdit ? "updated" : "created"
					} with warnings: ${result.warnings.join(", ")}`,
				});
			} else {
				toast({
					title: "Success",
					description: `Post ${isEdit ? "updated" : "created"} successfully`,
				});
			}

			router.push("/dashboard/blogs");
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to save post",
			});
		} finally {
			setLoading(false);
		}
	};

	const onInvalid = () => {
		toast({
			variant: "destructive",
			title: "Validation Error",
			description:
				"Please fix the highlighted fields — check both language tabs.",
		});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit, onInvalid)}
				className="space-y-6"
			>
				<div className="bg-card rounded-lg border border-border p-4 sm:p-6 space-y-4">
					<div>
						<h2 className="text-lg font-semibold">Post settings</h2>
						<p className="text-sm text-muted-foreground">
							Status, featured image and related Shopify products.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="published">Published</SelectItem>
											<SelectItem value="archived">Archived</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-2">
							<Label>Related products</Label>
							<Popover open={productsOpen} onOpenChange={setProductsOpen}>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										role="combobox"
										className="w-full justify-between font-normal"
									>
										{selectedProducts.length > 0
											? `${selectedProducts.length} product(s) selected`
											: "Select products"}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[340px] p-0" align="start">
									{/* Filtering happens server-side via the Shopify search */}
									<Command shouldFilter={false}>
										<CommandInput
											placeholder="Search Shopify products..."
											value={productSearch}
											onValueChange={setProductSearch}
										/>
										<CommandList>
											{productsLoading ? (
												<div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
													<Loader2 className="h-4 w-4 animate-spin" />
													Loading products...
												</div>
											) : productsError ? (
												<div className="px-4 py-6 text-center text-sm text-destructive">
													{productsError}
												</div>
											) : (
												<>
													<CommandEmpty>No products found</CommandEmpty>
													<CommandGroup>
														{productOptions.map((option) => (
															<CommandItem
																key={option.handle}
																value={option.handle}
																onSelect={() => toggleProduct(option)}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		selectedProducts.some(
																			(p) => p.handle === option.handle
																		)
																			? "opacity-100"
																			: "opacity-0"
																	)}
																/>
																{option.image_url ? (
																	<img
																		src={option.image_url}
																		alt={option.title}
																		className="mr-2 h-8 w-8 shrink-0 rounded object-cover"
																	/>
																) : (
																	<div className="mr-2 h-8 w-8 shrink-0 rounded bg-muted" />
																)}
																<div className="min-w-0">
																	<p className="truncate text-sm">
																		{option.title}
																	</p>
																	{option.price_amount && (
																		<p className="text-xs text-muted-foreground">
																			{option.price_amount}{" "}
																			{option.currency_code ?? ""}
																		</p>
																	)}
																</div>
															</CommandItem>
														))}
													</CommandGroup>
												</>
											)}
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
							{selectedProducts.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{selectedProducts.map((product) => (
										<Badge
											key={product.handle}
											variant="secondary"
											className="pr-1"
										>
											{product.title}
											<button
												type="button"
												onClick={() => toggleProduct(product)}
												className="ml-1 hover:text-destructive"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label>Featured image</Label>
						{featuredImage ? (
							<div className="relative w-fit">
								<img
									src={featuredImage}
									alt="Featured"
									className="h-32 w-56 rounded-lg border object-cover"
								/>
								<Button
									type="button"
									size="icon"
									variant="destructive"
									className="absolute top-2 right-2 h-7 w-7"
									onClick={() =>
										form.setValue("featured_image", "", { shouldDirty: true })
									}
								>
									<X className="h-4 w-4" />
									<span className="sr-only">Remove featured image</span>
								</Button>
							</div>
						) : (
							<div>
								<Button
									type="button"
									variant="outline"
									disabled={uploadingFeatured}
									onClick={() =>
										document.getElementById("blog-featured-upload")?.click()
									}
								>
									<Upload className="mr-2 h-4 w-4" />
									{uploadingFeatured ? "Uploading..." : "Upload image"}
								</Button>
							</div>
						)}
						<input
							id="blog-featured-upload"
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFeaturedUpload}
						/>
					</div>
				</div>

				<div className="bg-card rounded-lg border border-border p-4 sm:p-6">
					<Tabs defaultValue="en">
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="en">English</TabsTrigger>
							<TabsTrigger value="ar">العربية</TabsTrigger>
						</TabsList>
						<TabsContent value="en" className="pt-4">
							<TranslationTab
								form={form}
								language="en"
								slugTouchedRef={enSlugTouched}
							/>
						</TabsContent>
						<TabsContent value="ar" className="pt-4">
							<TranslationTab
								form={form}
								language="ar"
								slugTouchedRef={arSlugTouched}
							/>
						</TabsContent>
					</Tabs>
				</div>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/dashboard/blogs")}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEdit ? "Update Post" : "Create Post"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
