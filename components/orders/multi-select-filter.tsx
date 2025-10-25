"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
	label: string;
	value: string;
}

interface MultiSelectFilterProps {
	options: MultiSelectOption[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	label?: string;
}

export function MultiSelectFilter({
	options,
	value,
	onChange,
	placeholder = "Select...",
	label,
}: MultiSelectFilterProps) {
	const [open, setOpen] = useState(false);

	const handleToggle = (optionValue: string) => {
		const newValue = value.includes(optionValue)
			? value.filter((v) => v !== optionValue)
			: [...value, optionValue];
		onChange(newValue);
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange([]);
	};

	const getDisplayText = () => {
		if (value.length === 0) {
			return placeholder;
		}
		if (value.length === 1) {
			return options.find((opt) => opt.value === value[0])?.label || value[0];
		}
		if (value.length === 2) {
			return `${options.find((opt) => opt.value === value[0])?.label}, ${
				options.find((opt) => opt.value === value[1])?.label
			}`;
		}
		return `${value.length} selected`;
	};

	return (
		<div className="space-y-2">
			{label && <label className="text-sm font-medium">{label}</label>}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className={cn(
							"w-full justify-between font-normal",
							value.length === 0 && "text-muted-foreground"
						)}
					>
						<span className="truncate">{getDisplayText()}</span>
						<div className="flex items-center gap-2 ml-2">
							{value.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									className="h-4 w-4 p-0 hover:bg-transparent"
									onClick={handleClear}
								>
									<X className="h-3 w-3" />
								</Button>
							)}
						</div>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<div className="max-h-64 overflow-auto p-1">
						{options.map((option) => {
							const isSelected = value.includes(option.value);
							return (
								<div
									key={option.value}
									className={cn(
										"flex items-center space-x-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent",
										isSelected && "bg-accent/50"
									)}
									onClick={() => handleToggle(option.value)}
								>
									<Checkbox
										checked={isSelected}
										onCheckedChange={() => handleToggle(option.value)}
										onClick={(e) => e.stopPropagation()}
									/>
									<label className="flex-1 cursor-pointer text-sm">
										{option.label}
									</label>
									{isSelected && <Check className="h-4 w-4 text-primary" />}
								</div>
							);
						})}
					</div>
					{value.length > 0 && (
						<>
							<div className="border-t" />
							<div className="p-2">
								<Button
									variant="ghost"
									size="sm"
									className="w-full"
									onClick={() => {
										onChange([]);
										setOpen(false);
									}}
								>
									Clear All
								</Button>
							</div>
						</>
					)}
				</PopoverContent>
			</Popover>
		</div>
	);
}
