"use client";

import { useState } from "react";
import {
	Star,
	ChevronLeft,
	ChevronRight,
	Plus,
	Minus,
	ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MobileFrame } from "@/components/ui/mobile-frame";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types/store-types";

export interface ProductPreviewData {
	name: string;
	name_ar: string;
	description?: string;
	description_ar?: string;
	price: number;
	discounted_price?: number;
	currency: Currency;
	is_best_seller: boolean;
	is_featured: boolean;
	is_available: boolean;
	is_oos: boolean;
	is_for_rent: boolean;
	images: { url: string; is_main: boolean }[];
}

interface ProductMobilePreviewProps {
	data: ProductPreviewData;
	className?: string;
}

/**
 * A mobile product preview component that simulates how the product would appear
 * in the mobile app. Includes language toggle for English/Arabic preview.
 */
export function ProductMobilePreview({
	data,
	className,
}: ProductMobilePreviewProps) {
	const [isArabic, setIsArabic] = useState(false);

	// Get the main image or fallback to first image or placeholder
	const mainImage =
		data.images?.find((img) => img.is_main)?.url ||
		data.images?.[0]?.url ||
		"/placeholder.svg";

	// Get the appropriate text based on language
	const displayName = isArabic ? data.name_ar || data.name : data.name;
	const displayDescription = isArabic
		? data.description_ar || data.description
		: data.description;

	// Calculate discount percentage if discounted price exists
	const discountPercentage =
		data.discounted_price && data.price > data.discounted_price
			? Math.round(((data.price - data.discounted_price) / data.price) * 100)
			: 0;

	// Format price with currency
	const formatPrice = (price: number) => {
		return `${price} ${data.currency}`;
	};

	// Get special labels to display
	const getSpecialLabels = () => {
		const labels: string[] = [];
		if (data.is_best_seller) labels.push("Best Seller");
		if (data.is_featured) labels.push("Featured");
		if (data.is_for_rent) labels.push("For Rent");
		if (data.is_oos) labels.push("Out of Stock");
		if (!data.is_available) labels.push("Unavailable");
		return labels;
	};

	const specialLabels = getSpecialLabels();

	return (
		<div className={cn("space-y-4", className)}>
			{/* Language Toggle */}
			<div className="flex items-center justify-center space-x-2 p-4 bg-muted rounded-lg">
				<Label htmlFor="language-toggle" className="text-sm font-medium">
					English
				</Label>
				<Switch
					id="language-toggle"
					checked={isArabic}
					onCheckedChange={setIsArabic}
				/>
				<Label htmlFor="language-toggle" className="text-sm font-medium">
					العربية
				</Label>
			</div>

			{/* Mobile Preview */}
			<MobileFrame>
				<div
					className={cn(
						"h-full bg-white flex flex-col",
						isArabic && "text-right"
					)}
					dir={isArabic ? "rtl" : "ltr"}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 flex-shrink-0">
						<ChevronLeft className="w-5 h-5 text-gray-700" />
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-gray-300 rounded-full"></div>
							<div className="w-2 h-2 bg-gray-300 rounded-full"></div>
							<div className="w-2 h-2 bg-gray-300 rounded-full"></div>
							<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						</div>
					</div>

					{/* Scrollable Content */}
					<div className="flex-1 overflow-y-auto">
						{/* Product Image */}
						<div className="relative h-48 bg-gray-100">
							<img
								src={mainImage}
								alt={displayName}
								className="w-full h-full object-cover"
								onError={(e) => {
									e.currentTarget.src = "/placeholder.svg";
								}}
							/>
							{discountPercentage > 0 && (
								<div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm">
									{discountPercentage}% OFF
								</div>
							)}
						</div>

						{/* Content */}
						<div className="px-4 pt-4 pb-4 space-y-5">
							{/* Product Name */}
							<div className="space-y-3">
								<h1 className="text-lg font-bold text-gray-900 leading-tight">
									{displayName || (isArabic ? "اسم المنتج" : "Product Name")}
								</h1>

								{/* Rating (dummy data) */}
								<div className="flex items-center gap-2">
									<span className="text-sm text-gray-500">(100)</span>
									<div className="flex items-center gap-1">
										<Star className="w-4 h-4 text-yellow-400 fill-current" />
										<span className="text-sm font-medium text-gray-700">
											4.5
										</span>
									</div>
								</div>
							</div>

							{/* Special Labels */}
							{specialLabels.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{specialLabels.map((label, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-none"
										>
											{label}
										</Badge>
									))}
								</div>
							)}

							{/* Price and Quantity */}
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<div className="flex items-baseline gap-2">
										{data.discounted_price &&
										data.discounted_price < data.price ? (
											<>
												<span className="text-lg font-bold text-orange-500">
													{formatPrice(data.discounted_price)}
												</span>
												<span className="text-sm text-gray-400 line-through">
													{formatPrice(data.price)}
												</span>
											</>
										) : (
											<span className="text-lg font-bold text-orange-500">
												{formatPrice(data.price)}
											</span>
										)}
									</div>
								</div>

								{/* Quantity Selector */}
								<div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
									<button className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors">
										<Minus className="w-3 h-3 text-gray-600" />
									</button>
									<span className="px-3 py-2 text-sm font-medium min-w-[2.5rem] text-center border-x border-gray-200 text-gray-900">
										1
									</span>
									<button className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors">
										<Plus className="w-3 h-3 text-gray-600" />
									</button>
								</div>
							</div>

							{/* Product Details Section */}
							<div className="space-y-3 border-t border-gray-100 pt-4">
								<h3 className="font-semibold text-gray-900 text-base">
									{isArabic ? "تفاصيل المنتج" : "Product Details"}
								</h3>
								<p className="text-gray-600 text-sm leading-relaxed">
									{displayDescription ||
										(isArabic
											? "مصمم لتوفير الدعم والاستقرار لإصابات الكتف والألم."
											: "Designed to provide support and stability for shoulder injuries and pain.")}
								</p>
							</div>

							{/* How To Use It Section */}
							<div className="border-t border-gray-100 pt-4">
								<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
									<span className="font-medium text-gray-900 text-sm">
										{isArabic ? "كيفية الاستخدام" : "How To Use It"}
									</span>
									<ChevronRight
										className={cn(
											"w-4 h-4 text-gray-400",
											isArabic && "rotate-180"
										)}
									/>
								</div>
							</div>

							{/* Similar Products Section */}
							<div className="border-t border-gray-100 pt-4 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="w-1 h-5 bg-orange-500 rounded"></div>
										<span className="font-semibold text-gray-900 text-base">
											{isArabic ? "منتجات مشابهة" : "Similar Products"}
										</span>
									</div>
									<span className="text-orange-500 text-sm font-medium">
										{isArabic ? "عرض المزيد" : "See More"}
									</span>
								</div>

								{/* Similar Product Card (dummy) */}
								<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
									<div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
										<img
											src="/placeholder.svg"
											alt="Similar product"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="flex-1 space-y-1 min-w-0">
										<h4 className="font-medium text-sm text-gray-900 line-clamp-1">
											{isArabic
												? "دعامة الركبة القابلة للتعديل"
												: "Adjustable Knee Brace"}
										</h4>
										<div className="flex items-center gap-2">
											<span className="text-xs text-gray-400 line-through">
												250 {data.currency}
											</span>
											<span className="text-sm font-semibold text-orange-500">
												200 {data.currency}
											</span>
										</div>
									</div>
									<div className="flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full flex-shrink-0">
										<ShoppingCart className="w-3 h-3 text-blue-600" />
									</div>
								</div>

								{/* Duration section (only show for rental items) */}
								{data.is_for_rent && (
									<div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
										<div className="w-4 h-4 border border-blue-400 rounded flex items-center justify-center">
											<div className="w-2 h-2 bg-blue-400 rounded"></div>
										</div>
										<span className="text-sm font-medium text-blue-700">
											{isArabic ? "المدة: 3 أشهر" : "Duration: 3 Months"}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Bottom Actions - Sticky Footer */}
					<div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 flex gap-3">
						<button className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
							<ShoppingCart className="w-4 h-4 text-gray-600" />
						</button>
						<button className="flex-1 flex items-center justify-center p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors">
							{isArabic ? "اشتري الآن" : "Buy Now"}
							<ChevronRight
								className={cn("w-4 h-4 ml-1", isArabic && "rotate-180")}
							/>
						</button>
					</div>
				</div>
			</MobileFrame>
		</div>
	);
}
