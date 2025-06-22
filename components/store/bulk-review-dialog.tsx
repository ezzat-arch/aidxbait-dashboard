"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type {
	ProductWithCategory,
	BulkCreateReviewsData,
} from "@/types/store-types";

const formSchema = z.object({
	product_id: z.string().min(1, "Please select a product"),
	count: z
		.number()
		.min(1, "Count must be at least 1")
		.max(100, "Count cannot exceed 100"),
	rating: z
		.number()
		.min(1, "Rating must be at least 1")
		.max(5, "Rating cannot exceed 5"),
});

type FormData = z.infer<typeof formSchema>;

interface BulkReviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	products: ProductWithCategory[];
}

export function BulkReviewDialog({
	open,
	onOpenChange,
	onSuccess,
	products,
}: BulkReviewDialogProps) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			product_id: "",
			count: 10,
			rating: 5,
		},
	});

	const onSubmit = async (data: FormData) => {
		try {
			setLoading(true);

			const bulkData: BulkCreateReviewsData = {
				product_id: parseInt(data.product_id),
				count: data.count,
				rating: data.rating,
			};

			const response = await fetch("/api/protected/store/reviews/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(bulkData),
			});

			if (!response.ok) {
				throw new Error("Failed to create bulk reviews");
			}

			toast({
				title: "Success",
				description: `Successfully created ${data.count} reviews for the selected product`,
			});

			onSuccess();
			onOpenChange(false);
			form.reset();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to create bulk reviews. Please try again.",
			});
		} finally {
			setLoading(false);
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

	const handleClose = () => {
		if (!loading) {
			onOpenChange(false);
			form.reset();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add Bulk Reviews</DialogTitle>
					<DialogDescription>
						Create multiple reviews for a selected product. This is useful for
						testing and demo purposes.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="product_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={loading}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a product" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{products.map((product) => (
												<SelectItem
													key={product.id}
													value={product.id.toString()}
												>
													{product.name} - {product.category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Choose the product to create reviews for
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="count"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Number of Reviews</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="1"
											max="100"
											{...field}
											onChange={(e) =>
												field.onChange(parseInt(e.target.value) || 0)
											}
											disabled={loading}
										/>
									</FormControl>
									<FormDescription>
										How many reviews to create (1-100)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="rating"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rating</FormLabel>
									<Select
										onValueChange={(value) => field.onChange(parseInt(value))}
										defaultValue={field.value.toString()}
										disabled={loading}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{[1, 2, 3, 4, 5].map((rating) => (
												<SelectItem key={rating} value={rating.toString()}>
													<div className="flex items-center space-x-2">
														<span>{rating}</span>
														<div className="flex">{renderStars(rating)}</div>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Star rating for all reviews (1-5 stars)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || products.length === 0}>
								{loading ? "Creating..." : "Create Reviews"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
