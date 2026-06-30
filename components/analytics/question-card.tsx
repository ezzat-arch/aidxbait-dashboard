import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { QuestionConfig, DateRange } from "@/types/analytics-types";
import { getAnalyticsSupabase } from "@/lib/supabase/analytics-client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChartRenderer } from "./chart-renderers/bar-chart-renderer";
import { LineChartRenderer } from "./chart-renderers/line-chart-renderer";
import { PieChartRenderer } from "./chart-renderers/pie-chart-renderer";
import { MetricRenderer } from "./chart-renderers/metric-renderer";

interface QuestionCardProps {
	question: QuestionConfig;
	dateRange: DateRange;
}

export async function QuestionCard({ question, dateRange }: QuestionCardProps) {
	let data: any[] = [];
	let error: string | null = null;

	try {
		// Execute the query
		const sql = question.query(dateRange);
		const supabase = getAnalyticsSupabase();

		// Try to execute the analytics query via RPC
		const { data: queryData, error: queryError } = await supabase.rpc(
			"execute_analytics_query",
			{ query_text: sql }
		);

		if (queryError) {
			console.error(`[Analytics Query Error - ${question.id}]`, queryError);
			error =
				"Analytics query execution failed. Database function not available. Please create the execute_analytics_query function.";
		} else {
			data = queryData || [];

			// Apply formatter if provided
			if (question.formatter && data && data.length > 0) {
				data = question.formatter(data);
			}
		}
	} catch (err) {
		console.error(`[Analytics Error - ${question.id}]`, err);
		error = err instanceof Error ? err.message : "Failed to fetch data";
	}

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<CardTitle className="text-lg">{question.title}</CardTitle>
				{question.description && (
					<p className="text-sm text-muted-foreground">
						{question.description}
					</p>
				)}
			</CardHeader>
			<CardContent className="flex-1">
				{error ? (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : (
					<QuestionRenderer question={question} data={data} />
				)}
			</CardContent>
		</Card>
	);
}

const QuestionRenderer = ({
	question,
	data,
}: {
	question: QuestionConfig;
	data: any[];
}) => {
	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-40 text-muted-foreground">
				No data available
			</div>
		);
	}

	switch (question.type) {
		case "table":
			return <TableRenderer data={data} />;

		case "bar_chart":
			return (
				<BarChartRenderer
					data={data}
					config={question.chartConfig || { dataKey: "value" }}
				/>
			);

		case "line_chart":
			return (
				<LineChartRenderer
					data={data}
					config={question.chartConfig || { dataKey: "value" }}
				/>
			);

		case "pie_chart":
			return (
				<PieChartRenderer
					data={data}
					config={question.chartConfig || { dataKey: "value" }}
				/>
			);

		case "metric":
			return (
				<MetricRenderer
					data={data}
					config={
						question.metricConfig || {
							valueKey: "value",
							label: question.title,
						}
					}
				/>
			);

		default:
			return <div>Unsupported question type</div>;
	}
};

const TableRenderer = ({ data }: { data: any[] }) => {
	if (!data || data.length === 0) return null;

	const columns = Object.keys(data[0]);

	return (
		<div className="rounded-md border overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((col) => (
							<TableHead key={col} className="font-semibold">
								{col
									.split("_")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((row, idx) => (
						<TableRow key={idx}>
							{columns.map((col) => (
								<TableCell key={col}>{formatCellValue(row[col])}</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};

const formatCellValue = (value: any): string => {
	if (value === null || value === undefined) return "-";
	if (typeof value === "number") {
		// Check if it's a decimal that looks like currency
		if (value % 1 !== 0) {
			return value.toFixed(2);
		}
		return value.toLocaleString();
	}
	if (typeof value === "boolean") return value ? "Yes" : "No";
	return String(value);
};
