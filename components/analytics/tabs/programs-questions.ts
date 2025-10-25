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
		id: "total-active-subscriptions-metric",
		title: "Total Active Subscriptions",
		description:
			"Current count of all active program subscriptions across the platform",
		type: "metric",
		query: () => `
			SELECT COUNT(*) as total
			FROM exercise_program_subscriptions
			WHERE is_active = true AND is_cancelled = false AND end_date > NOW()
		`,
		metricConfig: {
			valueKey: "total",
			label: "Active Subscriptions",
		},
	},
	{
		id: "total-videos-metric",
		title: "Total Exercise Videos",
		description: "Total number of exercise videos in the library",
		type: "metric",
		query: () => `
			SELECT COUNT(*) as total
			FROM videos
			WHERE soft_deleted = false
		`,
		metricConfig: {
			valueKey: "total",
			label: "Exercise Videos",
		},
	},
];

const subscriptionsQuestions: QuestionConfig[] = [
	{
		id: "active-subscriptions-by-program",
		title: "Active Subscriptions by Program",
		description: "Number of active subscriptions for each exercise program",
		type: "bar_chart",
		query: () => `
			SELECT 
				p.title as name,
				COUNT(eps.id) as value
			FROM programs p
			LEFT JOIN exercise_program_subscriptions eps 
				ON p.id = eps.program_id 
				AND eps.is_active = true
				AND eps.is_cancelled = false
				AND eps.end_date > NOW()
			WHERE p.soft_deleted = false
			GROUP BY p.id, p.title
			ORDER BY value DESC
			LIMIT 10
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
	{
		id: "subscription-status-distribution",
		title: "Subscription Status Distribution",
		description:
			"Breakdown of all program subscriptions by their current status",
		type: "pie_chart",
		query: () => `
			SELECT 
				CASE 
					WHEN is_cancelled = true THEN 'Cancelled'
					WHEN is_active = true AND end_date > NOW() THEN 'Active'
					WHEN end_date <= NOW() THEN 'Expired'
					ELSE 'Inactive'
				END as name,
				COUNT(*) as value
			FROM exercise_program_subscriptions
			GROUP BY 
				CASE 
					WHEN is_cancelled = true THEN 'Cancelled'
					WHEN is_active = true AND end_date > NOW() THEN 'Active'
					WHEN end_date <= NOW() THEN 'Expired'
					ELSE 'Inactive'
				END
			ORDER BY value DESC
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
			colors: [
				"hsl(var(--success))",
				"hsl(var(--destructive))",
				"hsl(var(--warning))",
				"hsl(var(--muted))",
			],
		},
	},
	{
		id: "subscription-trend",
		title: "New Subscriptions Over Time",
		description: "Number of new program subscriptions created per month",
		type: "line_chart",
		query: (dateRange: DateRange) => {
			const whereClause =
				dateRange.from && dateRange.to
					? `WHERE eps.created_at >= '${formatDateForSQL(dateRange.from)}' 
					   AND eps.created_at <= '${formatDateForSQL(dateRange.to)}'`
					: "";

			return `
				SELECT 
					TO_CHAR(DATE_TRUNC('month', eps.created_at), 'YYYY-MM') as name,
					COUNT(*) as value
				FROM exercise_program_subscriptions eps
				${whereClause}
				GROUP BY DATE_TRUNC('month', eps.created_at)
				ORDER BY DATE_TRUNC('month', eps.created_at) ASC
				LIMIT 12
			`;
		},
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
];

const programsQuestions: QuestionConfig[] = [
	{
		id: "programs-performance-table",
		title: "Program Performance Overview",
		description:
			"Comprehensive metrics for each program including subscriptions, videos, and revenue",
		type: "table",
		query: () => `
			SELECT 
				p.title as "Program Title",
				COUNT(DISTINCT pv.video_id) as "Video Count",
				COUNT(DISTINCT eps.id) FILTER (WHERE eps.is_active = true AND eps.is_cancelled = false AND eps.end_date > NOW()) as "Active Subs",
				COUNT(DISTINCT eps.id) as "Total Subs",
				p.price as "Price",
				SUM(CASE WHEN eps.is_active = true AND eps.is_cancelled = false AND eps.end_date > NOW() THEN p.price ELSE 0 END) as "Active Revenue"
			FROM programs p
			LEFT JOIN program_videos pv ON p.id = pv.program_id
			LEFT JOIN exercise_program_subscriptions eps ON p.id = eps.program_id
			WHERE p.soft_deleted = false
			GROUP BY p.id, p.title, p.price
			ORDER BY COUNT(DISTINCT eps.id) FILTER (WHERE eps.is_active = true AND eps.is_cancelled = false AND eps.end_date > NOW()) DESC
			LIMIT 15
		`,
	},
	{
		id: "programs-by-joint",
		title: "Programs by Joint/Condition",
		description:
			"Number of exercise programs available for each joint or condition",
		type: "bar_chart",
		query: () => `
			SELECT 
				pjn.name as name,
				COUNT(DISTINCT p.id) as value
			FROM program_joint_names pjn
			LEFT JOIN programs p ON pjn.id = p.joint_id AND p.soft_deleted = false
			GROUP BY pjn.id, pjn.name
			HAVING COUNT(DISTINCT p.id) > 0
			ORDER BY value DESC
		`,
		chartConfig: {
			dataKey: "value",
			nameKey: "name",
		},
	},
];

// Export collections
export const programsCollections: QuestionCollection[] = [
	{
		id: "overview",
		name: "Overview",
		description: "Key metrics and statistics",
		questions: overviewQuestions,
	},
	{
		id: "subscriptions",
		name: "Subscriptions",
		description: "Subscription trends and status",
		questions: subscriptionsQuestions,
	},
	{
		id: "programs",
		name: "Programs",
		description: "Program performance and distribution",
		questions: programsQuestions,
	},
];
