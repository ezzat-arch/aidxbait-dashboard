"use client";

import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange as DateRangeType } from "@/types/analytics-types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/components/ui/use-mobile";

interface DateRangeFilterProps {
	dateRange: DateRangeType;
	onChange: (range: DateRangeType) => void;
}

export const DateRangeFilter = ({
	dateRange,
	onChange,
}: DateRangeFilterProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [tempStart, setTempStart] = useState<Date | null>(null);
	const isMobile = useIsMobile();

	const presets = [
		{
			label: "Last 7 days",
			getValue: () => ({
				from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				to: new Date(),
			}),
		},
		{
			label: "Last 30 days",
			getValue: () => ({
				from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				to: new Date(),
			}),
		},
		{
			label: "Last 3 months",
			getValue: () => ({
				from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
				to: new Date(),
			}),
		},
		{
			label: "Last year",
			getValue: () => ({
				from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
				to: new Date(),
			}),
		},
	];

	const handlePresetClick = (preset: (typeof presets)[0]) => {
		onChange(preset.getValue());
		setTempStart(null);
		setIsOpen(false);
	};

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) return;

		if (!tempStart) {
			// First click - set start date
			setTempStart(date);
		} else {
			// Second click - set end date and complete range
			// Automatically swap if dates are in wrong order
			const start = tempStart < date ? tempStart : date;
			const end = tempStart < date ? date : tempStart;

			onChange({ from: start, to: end });
			setTempStart(null);
			setIsOpen(false);
		}
	};

	const handleClear = () => {
		setTempStart(null);
	};

	const formatDateRange = () => {
		if (!dateRange.from && !dateRange.to) {
			return "Select date range";
		}
		if (dateRange.from && dateRange.to) {
			return `${format(dateRange.from, "MMM d, yyyy")} - ${format(
				dateRange.to,
				"MMM d, yyyy"
			)}`;
		}
		if (dateRange.from) {
			return `From ${format(dateRange.from, "MMM d, yyyy")}`;
		}
		return "Select date range";
	};

	return (
		<div className="flex items-center gap-2">
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"justify-start text-left font-normal w-full sm:min-w-[280px]",
							!dateRange.from && !dateRange.to && "text-muted-foreground"
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{formatDateRange()}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)] overflow-x-auto" align="start">
					<div className="flex flex-col sm:flex-row">
						<div className="border-r p-3 space-y-2">
							<div className="text-sm font-medium mb-2">Quick Select</div>
							{presets.map((preset) => (
								<Button
									key={preset.label}
									variant="ghost"
									size="sm"
									className="w-full justify-start"
									onClick={() => handlePresetClick(preset)}
								>
									{preset.label}
								</Button>
							))}
						</div>
						<div className="p-3">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-sm text-muted-foreground">
										{tempStart
											? "Click end date"
											: "Click start date, then end date"}
									</p>
									{tempStart && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleClear}
											className="h-auto p-1"
										>
											<X className="h-3 w-3" />
										</Button>
									)}
								</div>
								<Calendar
									mode="single"
									selected={tempStart || undefined}
									onSelect={handleDateSelect}
									numberOfMonths={isMobile ? 1 : 2}
									disabled={(date) => date > new Date()}
									modifiers={{
										...(dateRange.from && { rangeStart: dateRange.from }),
										...(dateRange.to && { rangeEnd: dateRange.to }),
										...(dateRange.from &&
											dateRange.to && {
												rangeMiddle: (date: Date) => {
													const from = dateRange.from!;
													const to = dateRange.to!;
													return date > from && date < to;
												},
											}),
									}}
									modifiersClassNames={{
										rangeStart: "bg-primary text-primary-foreground",
										rangeEnd: "bg-primary text-primary-foreground",
										rangeMiddle: "bg-primary/10",
									}}
								/>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};
