"use client";

import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { ChartConfig } from "@/types/analytics-types";

interface PieChartRendererProps {
	data: any[];
	config: ChartConfig;
}

const DEFAULT_COLORS = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

export const PieChartRenderer = ({ data, config }: PieChartRendererProps) => {
	const colors = config.colors || DEFAULT_COLORS;

	return (
		<ResponsiveContainer width="100%" height={300}>
			<PieChart>
				<Pie
					data={data}
					dataKey={config.dataKey}
					nameKey={config.nameKey || "name"}
					cx="50%"
					cy="50%"
					outerRadius={100}
					label
				>
					{data.map((_, index) => (
						<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						backgroundColor: "hsl(var(--background))",
						border: "1px solid hsl(var(--border))",
						borderRadius: "6px",
					}}
				/>
				<Legend />
			</PieChart>
		</ResponsiveContainer>
	);
};
