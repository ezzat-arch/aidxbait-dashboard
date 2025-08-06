"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/store/products-tab";
import { JointsTab } from "@/components/store/joints-tab";
import { ReviewsTab } from "@/components/store/reviews-tab";

export function StoreDashboard() {
	const [activeTab, setActiveTab] = useState("products");

	return (
		<div className="flex flex-col space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="products">Products</TabsTrigger>
					<TabsTrigger value="joints">Joints</TabsTrigger>
					<TabsTrigger value="reviews">Reviews</TabsTrigger>
				</TabsList>

				<TabsContent value="products" className="space-y-4">
					<ProductsTab />
				</TabsContent>



				<TabsContent value="joints" className="space-y-4">
					<JointsTab />
				</TabsContent>

				<TabsContent value="reviews" className="space-y-4">
					<ReviewsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
