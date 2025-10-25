// Analytics types for modular question-based dashboard

export type QuestionType =
	| "table"
	| "bar_chart"
	| "line_chart"
	| "pie_chart"
	| "metric";

export interface DateRange {
	from: Date | null;
	to: Date | null;
}

export interface ChartConfig {
	xAxisKey?: string;
	yAxisKey?: string;
	dataKey: string;
	nameKey?: string;
	colors?: string[];
}

export interface QuestionConfig<T = any> {
	id: string;
	title: string;
	description?: string;
	type: QuestionType;
	query: (dateRange: DateRange) => string;
	chartConfig?: ChartConfig;
	formatter?: (data: any[]) => T[];
	metricConfig?: {
		valueKey: string;
		label: string;
		prefix?: string;
		suffix?: string;
	};
}

export interface QuestionCollection {
	id: string;
	name: string;
	description?: string;
	questions: QuestionConfig[];
}

export interface AnalyticsQueryResult {
	success: boolean;
	data?: any[];
	error?: string;
}
