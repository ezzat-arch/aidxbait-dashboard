import { ShopifyOrdersTable } from "@/components/shopify-orders/shopify-orders-table";

export default function ShopifyOrdersPage() {
	return (
		<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Shopify Orders</h1>
					<p className="text-sm text-muted-foreground">
						Orders placed on the Shopify storefront. Read-only - manage them in
						Shopify admin.
					</p>
				</div>
			</div>
			<ShopifyOrdersTable />
		</div>
	);
}
