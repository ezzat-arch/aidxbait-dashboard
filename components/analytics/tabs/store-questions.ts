import {
	QuestionConfig,
	QuestionCollection,
	DateRange,
} from "@/types/analytics-types";

// Helper function to format date for SQL
const formatDateForSQL = (date: Date | null): string => {
	if (!date) return "";
	return date.toISOString().split("T")[0];
};

// Question definitions
const overviewQuestions: QuestionConfig[] = [
	{
		id: "total-products-metric",
		title: "Total Active Products",
		description:
			"Total number of live products in the system (not soft deleted)",
		type: "metric",
		query: () => `
			SELECT COUNT(*) as total
			FROM products
			WHERE soft_deleted = false
		`,
		metricConfig: {
			valueKey: "total",
			label: "Active Products",
		},
	},
	{
		id: "products-by-price-range",
		title: "Products by Price Range",
		description: "Distribution of products across different price categories",
		type: "bar_chart",
		query: () => `
			SELECT 
				CASE 
					WHEN COALESCE(discounted_price, price) < 500 THEN 'Under 500 EGP'
					WHEN COALESCE(discounted_price, price) < 1000 THEN '500-1000 EGP'
					WHEN COALESCE(discounted_price, price) < 2000 THEN '1000-2000 EGP'
					WHEN COALESCE(discounted_price, price) < 5000 THEN '2000-5000 EGP'
					ELSE '5000+ EGP'
				END as name,
				COUNT(*) as value
			FROM products
			WHERE soft_deleted = false
			GROUP BY 
				CASE 
					WHEN COALESCE(discounted_price, price) < 500 THEN 'Under 500 EGP'
					WHEN COALESCE(discounted_price, price) < 1000 THEN '500-1000 EGP'
					WHEN COALESCE(discounted_price, price) < 2000 THEN '1000-2000 EGP'
					WHEN COALESCE(discounted_price, price) < 5000 THEN '2000-5000 EGP'
					ELSE '5000+ EGP'
				END
			ORDER BY MIN(COALESCE(discounted_price, price)) ASC
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "product-inventory-overview",
		title: "Product Inventory Overview",
		description:
			"Complete product catalog with pricing, stock, and availability status",
		type: "table",
		query: () => `
			SELECT 
				p.name as "Product Name",
				COALESCE(p.discounted_price, p.price) as "Price (EGP)",
				p.stock as "Stock",
				CASE 
					WHEN p.is_available THEN 'Available'
					ELSE 'Unavailable'
				END as "Status"
			FROM products p
			WHERE p.soft_deleted = false
			ORDER BY p.stock DESC, p.created_at DESC
			LIMIT 20
		`,
	},
];

const salesQuestions: QuestionConfig[] = [
	{
		id: "top-products-by-revenue",
		title: "Top 10 Products by Revenue",
		description:
			"Best-selling products ranked by total revenue (excludes pending and cancelled orders)",
		type: "bar_chart",
		query: (dateRange: DateRange) => {
			const dateFilter =
				dateRange.from && dateRange.to
					? `AND o.order_date >= '${formatDateForSQL(dateRange.from)}' 
             AND o.order_date <= '${formatDateForSQL(dateRange.to)}'`
					: "";

			return `
				SELECT 
					p.name as name,
					ROUND(SUM(oi.quantity * oi.price_at_purchase)::numeric, 2) as value
				FROM order_items oi
				INNER JOIN products p ON oi.product_id = p.id
				INNER JOIN orders o ON oi.order_id = o.id
				WHERE p.soft_deleted = false
					AND o.soft_deleted = false
					AND o.order_status NOT IN ('pending', 'cancelled')
					${dateFilter}
				GROUP BY p.id, p.name
				ORDER BY value DESC
				LIMIT 10
			`;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "product-sales-details",
		title: "Product Sales Performance",
		description:
			"Detailed sales metrics per product including revenue, units sold, and order statistics (excludes pending and cancelled orders)",
		type: "table",
		query: (dateRange: DateRange) => {
			const dateFilter =
				dateRange.from && dateRange.to
					? `AND o.order_date >= '${formatDateForSQL(dateRange.from)}' 
             AND o.order_date <= '${formatDateForSQL(dateRange.to)}'`
					: "";

			return `
				SELECT 
					p.name as "Product Name",
					ROUND(SUM(oi.quantity * oi.price_at_purchase)::numeric, 2) as "Total Revenue (EGP)",
					SUM(oi.quantity) as "Units Sold",
					COUNT(DISTINCT oi.order_id) as "Number of Orders",
					ROUND(AVG(oi.quantity * oi.price_at_purchase)::numeric, 2) as "Avg Order Value (EGP)",
					ROUND(AVG(oi.quantity)::numeric, 2) as "Avg Units per Order",
					p.stock as "Current Stock"
				FROM order_items oi
				INNER JOIN products p ON oi.product_id = p.id
				INNER JOIN orders o ON oi.order_id = o.id
				WHERE p.soft_deleted = false
					AND o.soft_deleted = false
					AND o.order_status NOT IN ('pending', 'cancelled')
					${dateFilter}
				GROUP BY p.id, p.name, p.stock
				ORDER BY SUM(oi.quantity * oi.price_at_purchase) DESC
				LIMIT 20
			`;
		},
	},
];

const inventoryQuestions: QuestionConfig[] = [
	{
		id: "products-by-stock-status",
		title: "Products by Stock Status",
		description:
			"Distribution of products across stock availability categories",
		type: "pie_chart",
		query: () => `
			SELECT 
				CASE 
					WHEN stock = 0 THEN 'Out of Stock'
					WHEN stock < 10 THEN 'Low Stock'
					WHEN stock < 50 THEN 'Medium Stock'
					ELSE 'Well Stocked'
				END as name,
				COUNT(*) as value
			FROM products
			WHERE soft_deleted = false
			GROUP BY 
				CASE 
					WHEN stock = 0 THEN 'Out of Stock'
					WHEN stock < 10 THEN 'Low Stock'
					WHEN stock < 50 THEN 'Medium Stock'
					ELSE 'Well Stocked'
				END
			ORDER BY value DESC
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
			colors: [
				"hsl(var(--destructive))",
				"hsl(var(--warning))",
				"hsl(var(--primary))",
				"hsl(var(--success))",
			],
		},
	},
	{
		id: "inventory-value-by-availability",
		title: "Inventory Value by Availability Status",
		description: "Total inventory value segmented by product availability",
		type: "bar_chart",
		query: () => `
			SELECT 
				CASE 
					WHEN is_available = true THEN 'Available'
					ELSE 'Unavailable'
				END as name,
				SUM(
					stock * COALESCE(discounted_price, price)
				)::numeric as value
			FROM products
			WHERE soft_deleted = false
			GROUP BY is_available
			ORDER BY value DESC
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
];

const reviewsQuestions: QuestionConfig[] = [
	{
		id: "avg-rating-by-joint",
		title: "Average Review Rating by Joint/Condition",
		description:
			"Average product ratings grouped by associated medical joints or conditions",
		type: "bar_chart",
		query: () => `
			SELECT 
				pjn.name as name,
				ROUND(AVG(pr.rating)::numeric, 2) as value,
				COUNT(DISTINCT pr.id) as review_count
			FROM product_joint_names pjn
			LEFT JOIN product_joints pj ON pjn.id = pj.joint_id
			LEFT JOIN products p ON pj.product_id = p.id AND p.soft_deleted = false
			LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.soft_deleted = false
			GROUP BY pjn.id, pjn.name
			HAVING COUNT(DISTINCT pr.id) > 0
			ORDER BY value DESC
			LIMIT 10
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "product-reviews-trend",
		title: "Product Reviews Over Time",
		description: "Number of product reviews submitted per month",
		type: "line_chart",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `AND pr.created_at >= '${formatDateForSQL(dateRange.from)}' 
					   AND pr.created_at <= '${formatDateForSQL(dateRange.to)}'`
					: "";

			return `
				SELECT 
					TO_CHAR(DATE_TRUNC('month', pr.created_at), 'YYYY-MM') as name,
					COUNT(*) as value
				FROM product_reviews pr
				WHERE pr.soft_deleted = false
				${whereClause}
				GROUP BY DATE_TRUNC('month', pr.created_at)
				ORDER BY DATE_TRUNC('month', pr.created_at) ASC
				LIMIT 12
			`;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "top-rated-products",
		title: "Top 10 Rated Products",
		description:
			"Products with highest average ratings (minimum 3 reviews required)",
		type: "table",
		query: () => `
			SELECT 
				p.name as "Product Name",
				ROUND(AVG(pr.rating)::numeric, 2) as "Avg Rating",
				COUNT(pr.id) as "Review Count",
				p.stock as "Stock",
				CASE 
					WHEN p.discounted_price IS NOT NULL THEN p.discounted_price
					ELSE p.price
				END as "Price (${"`"}${"`"}currency${"`"}${"`"})"
			FROM products p
			INNER JOIN product_reviews pr ON p.id = pr.product_id 
				AND pr.soft_deleted = false
			WHERE p.soft_deleted = false
			GROUP BY p.id, p.name, p.stock, p.price, p.discounted_price, p.currency
			HAVING COUNT(pr.id) >= 3
			ORDER BY AVG(pr.rating) DESC, COUNT(pr.id) DESC
			LIMIT 10
		`,
	},
];

// Export collections
export const storeCollections: QuestionCollection[] = [
	{
		id: "overview",
		name: "Overview",
		description: "Key metrics and statistics",
		questions: overviewQuestions,
	},
	{
		id: "sales",
		name: "Sales",
		description: "Revenue and sales performance analytics",
		questions: salesQuestions,
	},
	{
		id: "inventory",
		name: "Inventory",
		description: "Stock levels and inventory value",
		questions: inventoryQuestions,
	},
	{
		id: "reviews",
		name: "Reviews & Ratings",
		description: "Customer feedback and product ratings",
		questions: reviewsQuestions,
	},
];
