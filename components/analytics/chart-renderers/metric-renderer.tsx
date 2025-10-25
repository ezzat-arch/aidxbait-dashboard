"use client";

interface MetricConfig {
	valueKey: string;
	label: string;
	prefix?: string;
	suffix?: string;
}

interface MetricRendererProps {
	data: any[];
	config: MetricConfig;
}

export const MetricRenderer = ({ data, config }: MetricRendererProps) => {
	const value = data[0]?.[config.valueKey] || 0;

	const formattedValue =
		typeof value === "number" ? value.toLocaleString() : value;

	return (
		<div className="flex flex-col items-center justify-center h-40">
			<p className="text-sm text-muted-foreground mb-2">{config.label}</p>
			<div className="text-4xl font-bold">
				{config.prefix}
				{formattedValue}
				{config.suffix}
			</div>
		</div>
	);
};
