"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumericInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"type" | "onChange"
	> {
	value?: number | string;
	onChange?: (value: number) => void;
	allowDecimals?: boolean;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
	(
		{ className, value = "", onChange, allowDecimals = false, ...props },
		ref
	) => {
		// Convert number to string for display
		const displayValue = React.useMemo(() => {
			if (value === "" || value === 0) return "";
			return value.toString();
		}, [value]);

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;

			// Allow empty string
			if (inputValue === "") {
				onChange?.(0);
				return;
			}

			// Only allow digits and optionally one decimal point
			const numericRegex = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/;
			if (numericRegex.test(inputValue)) {
				const numericValue = allowDecimals
					? parseFloat(inputValue)
					: parseInt(inputValue);
				// Only call onChange if the value is a valid number
				if (!isNaN(numericValue)) {
					onChange?.(numericValue);
				} else if (allowDecimals && inputValue === ".") {
					// Allow just a decimal point as intermediate input
					onChange?.(0);
				}
			}
		};

		return (
			<Input
				type="text"
				inputMode={allowDecimals ? "decimal" : "numeric"}
				className={cn(className)}
				value={displayValue}
				onChange={handleInputChange}
				ref={ref}
				{...props}
			/>
		);
	}
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
