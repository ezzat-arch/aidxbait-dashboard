"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { ChartConfig } from "@/types/analytics-types";

interface BarChartRendererProps {
	data: any[];
	config: ChartConfig;
}

export const BarChartRenderer = ({ data, config }: BarChartRendererProps) => {
	const colors = config.colors || ["hsl(var(--primary))"];

	return (
		<ResponsiveContainer width="100%" height={300}>
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
				<XAxis
					dataKey={config.xAxisKey || config.nameKey || "name"}
					className="text-xs"
				/>
				<YAxis className="text-xs" />
				<Tooltip
					contentStyle={{
						backgroundColor: "hsl(var(--background))",
						border: "1px solid hsl(var(--border))",
						borderRadius: "6px",
					}}
				/>
				<Legend />
				<Bar dataKey={config.dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
			</BarChart>
		</ResponsiveContainer>
	);
};
