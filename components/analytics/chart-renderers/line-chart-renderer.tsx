"use client";

import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { ChartConfig } from "@/types/analytics-types";

interface LineChartRendererProps {
	data: any[];
	config: ChartConfig;
}

export const LineChartRenderer = ({ data, config }: LineChartRendererProps) => {
	const colors = config.colors || ["hsl(var(--primary))"];

	return (
		<ResponsiveContainer width="100%" height={300}>
			<LineChart data={data}>
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
				<Line
					type="monotone"
					dataKey={config.dataKey}
					stroke={colors[0]}
					strokeWidth={2}
					dot={{ r: 4 }}
					activeDot={{ r: 6 }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
};
