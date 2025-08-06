"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import type { ProductWithJoints, ProductJointName, ProductFormDrawerProps } from "@/types/store-types";

export function ProductFormDrawer({
	open,
	onOpenChange,
	onSuccess,
	title,
	description,
	product,
}: ProductFormDrawerProps) {
	const [loading, setLoading] = useState(false);

	const [joints, setJoints] = useState<ProductJointName[]>([]);
	const { toast } = useToast();

	useEffect(() => {
		if (open) {
			fetchJoints();
		}
	}, [open]);

	const fetchJoints = async () => {
		try {
			const response = await fetch("/api/protected/store/joints");
			if (response.ok) {
				const result = await response.json();
				setJoints(result.data);
			}
		} catch (error) {
			console.error("Failed to fetch joints:", error);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement product form submission
		toast({
			title: "Coming Soon",
			description: "Product form implementation is in progress",
		});
		onOpenChange(false);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-[600px] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription>{description}</SheetDescription>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-6 mt-6">
					<div className="text-center py-12 text-muted-foreground">
						<p>Product form with joints, images, tags, etc.</p>
						<p className="text-sm mt-2">
							This comprehensive form is being implemented...
						</p>
					</div>

					<div className="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Saving..." : "Save Product"}
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
