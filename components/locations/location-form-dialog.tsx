"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { LocationRow } from "@/types/location-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** null = create, otherwise edit */
	location: LocationRow | null;
	onSuccess: () => void;
}

const EMPTY_FORM = {
	location_name: "",
	latitude: "",
	longitude: "",
	latitude_delta: "0.30",
	longitude_delta: "0.30",
};

export function LocationFormDialog({
	open,
	onOpenChange,
	location,
	onSuccess,
}: Props) {
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const isEdit = location !== null;

	useEffect(() => {
		if (open) {
			setForm(
				location
					? {
							location_name: location.location_name,
							latitude: String(location.latitude),
							longitude: String(location.longitude),
							latitude_delta: String(location.latitude_delta),
							longitude_delta: String(location.longitude_delta),
						}
					: EMPTY_FORM
			);
		}
	}, [open, location]);

	const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const handleSubmit = async () => {
		const name = form.location_name.trim();
		const latitude = Number(form.latitude);
		const longitude = Number(form.longitude);
		const latitude_delta = Number(form.latitude_delta);
		const longitude_delta = Number(form.longitude_delta);

		if (!name) {
			toast({ variant: "destructive", title: "Validation", description: "Area name is required" });
			return;
		}
		if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
			toast({ variant: "destructive", title: "Validation", description: "Latitude must be between -90 and 90" });
			return;
		}
		if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
			toast({ variant: "destructive", title: "Validation", description: "Longitude must be between -180 and 180" });
			return;
		}
		if (Number.isNaN(latitude_delta) || latitude_delta <= 0 || Number.isNaN(longitude_delta) || longitude_delta <= 0) {
			toast({ variant: "destructive", title: "Validation", description: "Map span values must be positive numbers" });
			return;
		}

		setLoading(true);
		try {
			const url = isEdit
				? `/api/protected/locations/${location.id}`
				: "/api/protected/locations";
			const res = await fetch(url, {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location_name: name,
					latitude,
					longitude,
					latitude_delta,
					longitude_delta,
				}),
			});

			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to save service area");
			}

			toast({
				title: "Saved",
				description: isEdit
					? `"${name}" updated.`
					: `"${name}" added. Therapists can now select it and patients can book there.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to save service area",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? `Edit ${location.location_name}` : "Add service area"}
					</DialogTitle>
					<DialogDescription>
						Coordinates are the area center; the map span (deltas) controls the
						zoom level the apps use when showing this area.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="loc-name">Area name</Label>
						<Input
							id="loc-name"
							placeholder="e.g. Cairo"
							value={form.location_name}
							onChange={set("location_name")}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="loc-lat">Latitude</Label>
							<Input
								id="loc-lat"
								type="number"
								step="0.0001"
								placeholder="30.0444"
								value={form.latitude}
								onChange={set("latitude")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="loc-lng">Longitude</Label>
							<Input
								id="loc-lng"
								type="number"
								step="0.0001"
								placeholder="31.2357"
								value={form.longitude}
								onChange={set("longitude")}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="loc-latd">Latitude span</Label>
							<Input
								id="loc-latd"
								type="number"
								step="0.05"
								value={form.latitude_delta}
								onChange={set("latitude_delta")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="loc-lngd">Longitude span</Label>
							<Input
								id="loc-lngd"
								type="number"
								step="0.05"
								value={form.longitude_delta}
								onChange={set("longitude_delta")}
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEdit ? "Save changes" : "Add area"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
