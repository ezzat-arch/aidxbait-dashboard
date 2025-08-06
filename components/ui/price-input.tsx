"use client";

import * as React from "react";
import { NumericInput, NumericInputProps } from "@/components/ui/numeric-input";

export interface PriceInputProps
	extends Omit<NumericInputProps, "allowDecimals"> {}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
	(props, ref) => {
		return <NumericInput allowDecimals={true} ref={ref} {...props} />;
	}
);

PriceInput.displayName = "PriceInput";

export { PriceInput };
