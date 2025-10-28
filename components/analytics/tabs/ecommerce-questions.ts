import {
	QuestionConfig,
	QuestionCollection,
	DateRange,
} from "@/types/analytics-types";

// Helper function to format SQL date
function formatDateForSQL(date: Date | undefined): string {
	if (!date) return "";
	return date.toISOString().split("T")[0];
}

// ==================== FUNNEL OVERVIEW ====================

const funnelQuestions: QuestionConfig[] = [
	{
		id: "conversion-funnel",
		title: "E-commerce Conversion Funnel",
		description:
			"Sessions progressing through each stage of the purchase funnel",
		type: "bar_chart",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE viewed_at >= '${formatDateForSQL(dateRange.from)}' 
             AND viewed_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE viewed_at >= NOW() - INTERVAL '30 days'";

			return `
        SELECT 
          'Product Views' as name,
          COUNT(DISTINCT session_id) as value
        FROM product_views
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Added to Cart' as name,
          COUNT(DISTINCT session_id) as value
        FROM cart_events
        WHERE event_type = 'add' 
          AND created_at >= ${
						dateRange.from && dateRange.to
							? `'${formatDateForSQL(dateRange.from)}'`
							: "NOW() - INTERVAL '30 days'"
					}
          AND created_at <= ${
						dateRange.from && dateRange.to
							? `'${formatDateForSQL(dateRange.to)}'`
							: "NOW()"
					}
        
        UNION ALL
        
        SELECT 
          'Started Checkout' as name,
          COUNT(DISTINCT session_id) as value
        FROM checkout_events
        WHERE event_type = 'started' 
          AND created_at >= ${
						dateRange.from && dateRange.to
							? `'${formatDateForSQL(dateRange.from)}'`
							: "NOW() - INTERVAL '30 days'"
					}
          AND created_at <= ${
						dateRange.from && dateRange.to
							? `'${formatDateForSQL(dateRange.to)}'`
							: "NOW()"
					}
        
        UNION ALL
        
        SELECT 
          'Completed Order' as name,
          COUNT(DISTINCT session_id) as value
        FROM checkout_events
        WHERE event_type = 'payment_completed' 
          AND created_at >= ${
						dateRange.from && dateRange.to
							? `'${formatDateForSQL(dateRange.from)}'`
							: "NOW() - INTERVAL '30 days'"
					}
          AND created_at <= ${
						dateRange.from && dateRange.to
							? `'${formatDateForSQL(dateRange.to)}'`
							: "NOW()"
					}
        
        ORDER BY value DESC
      `;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "overall-conversion-rate",
		title: "Overall Conversion Rate",
		description: "Percentage of sessions that result in a completed order",
		type: "metric",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE pv.viewed_at >= '${formatDateForSQL(dateRange.from)}' 
             AND pv.viewed_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'";

			return `
        WITH sessions_with_views AS (
          SELECT COUNT(DISTINCT session_id) as total_sessions
          FROM product_views pv
          ${whereClause}
        ),
        sessions_with_orders AS (
          SELECT COUNT(DISTINCT session_id) as completed_sessions
          FROM checkout_events
          WHERE event_type = 'payment_completed'
            AND created_at >= ${
							dateRange.from && dateRange.to
								? `'${formatDateForSQL(dateRange.from)}'`
								: "NOW() - INTERVAL '30 days'"
						}
            AND created_at <= ${
							dateRange.from && dateRange.to
								? `'${formatDateForSQL(dateRange.to)}'`
								: "NOW()"
						}
        )
        SELECT 
          ROUND((completed_sessions::DECIMAL / NULLIF(total_sessions, 0)) * 100, 2) as value
        FROM sessions_with_views, sessions_with_orders
      `;
		},
		metricConfig: {
			valueKey: "value",
			label: "Conversion Rate",
			suffix: "%",
		},
	},
];

// ==================== ABANDONMENT METRICS ====================

const abandonmentQuestions: QuestionConfig[] = [
	{
		id: "cart-abandonment-rate",
		title: "Cart Abandonment Rate",
		description:
			"Percentage of carts that were abandoned without completing purchase",
		type: "metric",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE snapshot_at >= '${formatDateForSQL(dateRange.from)}' 
             AND snapshot_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE snapshot_at >= NOW() - INTERVAL '30 days'";

			return `
        WITH cart_stats AS (
          SELECT 
            COUNT(DISTINCT CASE WHEN is_abandoned = TRUE THEN id END) as abandoned_carts,
            COUNT(DISTINCT id) as total_carts
          FROM cart_snapshots
          ${whereClause}
            AND item_count > 0
        )
        SELECT 
          ROUND((abandoned_carts::DECIMAL / NULLIF(total_carts, 0)) * 100, 2) as value
        FROM cart_stats
      `;
		},
		metricConfig: {
			valueKey: "value",
			label: "Cart Abandonment Rate",
			suffix: "%",
		},
	},
	{
		id: "checkout-abandonment-rate",
		title: "Checkout Abandonment Rate",
		description: "Percentage of checkouts that were started but not completed",
		type: "metric",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE created_at >= '${formatDateForSQL(dateRange.from)}' 
             AND created_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE created_at >= NOW() - INTERVAL '30 days'";

			return `
        WITH checkout_stats AS (
          SELECT 
            COUNT(DISTINCT CASE WHEN event_type = 'started' THEN session_id END) as started,
            COUNT(DISTINCT CASE WHEN event_type = 'payment_completed' THEN session_id END) as completed
          FROM checkout_events
          ${whereClause}
        )
        SELECT 
          ROUND(((started - completed)::DECIMAL / NULLIF(started, 0)) * 100, 2) as value
        FROM checkout_stats
      `;
		},
		metricConfig: {
			valueKey: "value",
			label: "Checkout Abandonment Rate",
			suffix: "%",
		},
	},
	{
		id: "abandoned-vs-completed-value",
		title: "Average Cart Value: Abandoned vs Completed",
		description:
			"Comparison of average cart values for abandoned and completed purchases",
		type: "bar_chart",
		query: (dateRange: DateRange) => {
			const cartWhereClause =
				dateRange.from && dateRange.to
					? `WHERE cs.snapshot_at >= '${formatDateForSQL(dateRange.from)}' 
             AND cs.snapshot_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE cs.snapshot_at >= NOW() - INTERVAL '30 days'";

			const orderWhereClause =
				dateRange.from && dateRange.to
					? `WHERE order_date >= '${formatDateForSQL(dateRange.from)}' 
             AND order_date <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE order_date >= NOW() - INTERVAL '30 days'";

			return `
        SELECT 
          'Abandoned Carts' as name,
          ROUND(AVG(cs.total_value), 2) as value
        FROM cart_snapshots cs
        ${cartWhereClause}
          AND cs.is_abandoned = TRUE 
        
        UNION ALL
        
        SELECT 
          'Completed Orders' as name,
          ROUND(AVG(total_amount), 2) as value
        FROM orders
        ${orderWhereClause}
          AND order_status IN ('delivered', 'confirmed')
          AND soft_deleted = FALSE
      `;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "abandonment-by-day",
		title: "Cart Abandonment by Day of Week",
		description: "Which days have the highest cart abandonment",
		type: "bar_chart",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE snapshot_at >= '${formatDateForSQL(dateRange.from)}' 
             AND snapshot_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE snapshot_at >= NOW() - INTERVAL '30 days'";

			return `
        SELECT 
          TO_CHAR(snapshot_at, 'Day') as name,
          COUNT(*) as value
        FROM cart_snapshots
        ${whereClause}
          AND is_abandoned = TRUE
        GROUP BY TO_CHAR(snapshot_at, 'Day'), EXTRACT(DOW FROM snapshot_at)
        ORDER BY EXTRACT(DOW FROM snapshot_at)
      `;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
];

// ==================== PRODUCT PERFORMANCE ====================

const productPerformanceQuestions: QuestionConfig[] = [
	{
		id: "most-viewed-products",
		title: "Top 10 Most Viewed Products",
		description: "Products with the highest view counts",
		type: "table",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE pv.viewed_at >= '${formatDateForSQL(dateRange.from)}' 
             AND pv.viewed_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'";

			return `
        SELECT 
          p.name as "Product Name",
          COUNT(pv.id) as "Total Views",
          COUNT(DISTINCT pv.session_id) as "Unique Visitors",
          ROUND(AVG(pv.duration_seconds), 0) as "Avg View Duration (sec)"
        FROM product_views pv
        JOIN products p ON p.id = pv.product_id
        ${whereClause}
          AND p.soft_deleted = FALSE
        GROUP BY p.id, p.name
        ORDER BY "Total Views" DESC
        LIMIT 10
      `;
		},
	},
	{
		id: "top-abandoned-products",
		title: "Top 10 Products in Abandoned Carts",
		description: "Products most frequently left in abandoned carts",
		type: "table",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE cs.snapshot_at >= '${formatDateForSQL(dateRange.from)}' 
             AND cs.snapshot_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE cs.snapshot_at >= NOW() - INTERVAL '30 days'";

			return `
        SELECT 
          p.name as "Product Name",
          COUNT(*) as "Times Abandoned",
          ROUND(AVG((item->>'quantity')::INTEGER), 1) as "Avg Quantity",
          ROUND(AVG((item->>'price')::DECIMAL), 2) as "Avg Price (EGP)"
        FROM cart_snapshots cs
        CROSS JOIN LATERAL jsonb_array_elements(cs.cart_items) as item
        JOIN products p ON p.id = (item->>'product_id')::INTEGER
        ${whereClause}
          AND cs.is_abandoned = TRUE
          AND p.soft_deleted = FALSE
        GROUP BY p.id, p.name
        ORDER BY "Times Abandoned" DESC
        LIMIT 10
      `;
		},
	},
	{
		id: "view-to-cart-conversion",
		title: "Best View-to-Cart Conversion Products",
		description: "Products with the highest conversion from views to cart adds",
		type: "table",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE pv.viewed_at >= '${formatDateForSQL(dateRange.from)}' 
             AND pv.viewed_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'";

			return `
        WITH product_views_count AS (
          SELECT 
            product_id,
            COUNT(DISTINCT session_id) as view_sessions
          FROM product_views pv
          ${whereClause}
          GROUP BY product_id
        ),
        product_cart_adds AS (
          SELECT 
            product_id,
            COUNT(DISTINCT session_id) as cart_sessions
          FROM cart_events ce
          WHERE event_type = 'add'
            AND created_at >= ${
							dateRange.from && dateRange.to
								? `'${formatDateForSQL(dateRange.from)}'`
								: "NOW() - INTERVAL '30 days'"
						}
            AND created_at <= ${
							dateRange.from && dateRange.to
								? `'${formatDateForSQL(dateRange.to)}'`
								: "NOW()"
						}
          GROUP BY product_id
        )
        SELECT 
          p.name as "Product Name",
          pv.view_sessions as "Views",
          COALESCE(pc.cart_sessions, 0) as "Cart Adds",
          ROUND((COALESCE(pc.cart_sessions, 0)::DECIMAL / NULLIF(pv.view_sessions, 0)) * 100, 2) as "Conversion %"
        FROM product_views_count pv
        JOIN products p ON p.id = pv.product_id
        LEFT JOIN product_cart_adds pc ON pc.product_id = pv.product_id
        WHERE p.soft_deleted = FALSE
          AND pv.view_sessions >= 10
        ORDER BY "Conversion %" DESC
        LIMIT 10
      `;
		},
	},
];

// ==================== TEMPORAL PATTERNS ====================

const temporalQuestions: QuestionConfig[] = [
	{
		id: "daily-conversion-trend",
		title: "Daily Conversion Rate Trend",
		description: "Conversion rate over time",
		type: "line_chart",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE DATE(pv.viewed_at) >= '${formatDateForSQL(dateRange.from)}' 
             AND DATE(pv.viewed_at) <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'";

			return `
        WITH daily_sessions AS (
          SELECT 
            DATE(pv.viewed_at) as date,
            COUNT(DISTINCT pv.session_id) as total_sessions
          FROM product_views pv
          ${whereClause}
          GROUP BY DATE(pv.viewed_at)
        ),
        daily_conversions AS (
          SELECT 
            DATE(ce.created_at) as date,
            COUNT(DISTINCT ce.session_id) as converted_sessions
          FROM checkout_events ce
          WHERE ce.event_type = 'payment_completed'
            AND DATE(ce.created_at) >= ${
							dateRange.from && dateRange.to
								? `'${formatDateForSQL(dateRange.from)}'`
								: "(NOW() - INTERVAL '30 days')::DATE"
						}
            AND DATE(ce.created_at) <= ${
							dateRange.from && dateRange.to
								? `'${formatDateForSQL(dateRange.to)}'`
								: "NOW()::DATE"
						}
          GROUP BY DATE(ce.created_at)
        )
        SELECT 
          TO_CHAR(ds.date, 'YYYY-MM-DD') as name,
          ROUND((COALESCE(dc.converted_sessions, 0)::DECIMAL / NULLIF(ds.total_sessions, 0)) * 100, 2) as value
        FROM daily_sessions ds
        LEFT JOIN daily_conversions dc ON dc.date = ds.date
        ORDER BY ds.date ASC
      `;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "session-duration-comparison",
		title: "Average Session Duration: Abandoned vs Converted",
		description: "How session duration affects conversion",
		type: "bar_chart",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE us.started_at >= '${formatDateForSQL(dateRange.from)}' 
             AND us.started_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE us.started_at >= NOW() - INTERVAL '30 days'";

			return `
        WITH abandoned_sessions AS (
          SELECT 
            AVG(EXTRACT(EPOCH FROM (us.last_activity_at - us.started_at)) / 60) as avg_minutes
          FROM user_sessions us
          JOIN cart_snapshots cs ON cs.session_id = us.id
          ${whereClause}
            AND cs.is_abandoned = TRUE
        ),
        converted_sessions AS (
          SELECT 
            AVG(EXTRACT(EPOCH FROM (us.last_activity_at - us.started_at)) / 60) as avg_minutes
          FROM user_sessions us
          JOIN checkout_events ce ON ce.session_id = us.id
          ${whereClause.replace("us.started_at", "ce.created_at")}
            AND ce.event_type = 'payment_completed'
        )
        SELECT 'Abandoned Carts' as name, ROUND(avg_minutes, 2) as value FROM abandoned_sessions
        UNION ALL
        SELECT 'Completed Orders' as name, ROUND(avg_minutes, 2) as value FROM converted_sessions
      `;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
];

// ==================== RECOVERY OPPORTUNITIES ====================

const recoveryQuestions: QuestionConfig[] = [
	{
		id: "high-value-abandoned-carts",
		title: "High-Value Abandoned Carts (>500 EGP)",
		description:
			"Abandoned carts with significant value for recovery campaigns",
		type: "table",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE cs.snapshot_at >= '${formatDateForSQL(dateRange.from)}' 
             AND cs.snapshot_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE cs.snapshot_at >= NOW() - INTERVAL '7 days'";

			return `
        SELECT 
          cs.id as "Cart ID",
          COALESCE(u.email, 'Guest') as "User Email",
          cs.total_value as "Cart Value (EGP)",
          cs.item_count as "Items",
          TO_CHAR(cs.snapshot_at, 'YYYY-MM-DD HH24:MI') as "Abandoned At"
        FROM cart_snapshots cs
        LEFT JOIN users u ON u.id = cs.user_id
        ${whereClause}
          AND cs.is_abandoned = TRUE
          AND cs.total_value > 500
        ORDER BY cs.total_value DESC
        LIMIT 20
      `;
		},
	},
	{
		id: "recent-abandonments",
		title: "Recent Abandoned Carts (Last 24 Hours)",
		description: "Fresh abandonment for immediate follow-up",
		type: "table",
		query: () => {
			return `
        SELECT 
          cs.id as "Cart ID",
          COALESCE(u.email, 'Guest') as "User Email",
          cs.total_value as "Cart Value (EGP)",
          cs.item_count as "Items",
          TO_CHAR(cs.snapshot_at, 'HH24:MI') as "Time"
        FROM cart_snapshots cs
        LEFT JOIN users u ON u.id = cs.user_id
        WHERE cs.snapshot_at >= NOW() - INTERVAL '24 hours'
          AND cs.is_abandoned = TRUE
        ORDER BY cs.snapshot_at DESC
        LIMIT 20
      `;
		},
	},
	{
		id: "repeat-abandoners",
		title: "Repeat Cart Abandoners",
		description: "Users with multiple abandoned carts",
		type: "table",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE cs.snapshot_at >= '${formatDateForSQL(dateRange.from)}' 
             AND cs.snapshot_at <= '${formatDateForSQL(dateRange.to)}'`
					: "WHERE cs.snapshot_at >= NOW() - INTERVAL '30 days'";

			return `
        SELECT 
          COALESCE(u.email, 'Guest User') as "User Email",
          COUNT(cs.id) as "Abandoned Carts",
          ROUND(AVG(cs.total_value), 2) as "Avg Cart Value (EGP)",
          TO_CHAR(MAX(cs.snapshot_at), 'YYYY-MM-DD') as "Last Abandonment"
        FROM cart_snapshots cs
        LEFT JOIN users u ON u.id = cs.user_id
        ${whereClause}
          AND cs.is_abandoned = TRUE
          AND cs.user_id IS NOT NULL
        GROUP BY u.email, cs.user_id
        HAVING COUNT(cs.id) >= 2
        ORDER BY "Abandoned Carts" DESC
        LIMIT 20
      `;
		},
	},
];

// ==================== EXPORT COLLECTIONS ====================

export const ecommerceCollections: QuestionCollection[] = [
	{
		id: "funnel-overview",
		name: "Funnel Overview",
		description: "Conversion funnel and overall performance metrics",
		questions: funnelQuestions,
	},
	{
		id: "abandonment-metrics",
		name: "Abandonment Metrics",
		description: "Cart and checkout abandonment analysis",
		questions: abandonmentQuestions,
	},
	{
		id: "product-performance",
		name: "Product Performance",
		description: "Product-level analytics and conversion rates",
		questions: productPerformanceQuestions,
	},
	{
		id: "temporal-patterns",
		name: "Temporal Patterns",
		description: "Time-based trends and patterns",
		questions: temporalQuestions,
	},
	{
		id: "recovery-opportunities",
		name: "Recovery Opportunities",
		description: "High-value opportunities for cart recovery",
		questions: recoveryQuestions,
	},
];
