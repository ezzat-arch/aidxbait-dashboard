import { OrdersDashboard } from "@/components/orders/orders-dashboard";

export default function OrdersPage() {
	return (
		<div className="flex flex-col h-full p-6 space-y-6">
			<OrdersDashboard />
		</div>
	);
}
