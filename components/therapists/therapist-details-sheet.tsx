"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Mail,
	Phone,
	Briefcase,
	Clock,
	FileText,
	MapPin,
	Loader2,
	ExternalLink,
	CheckCircle2,
	XCircle,
	Star,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import {
	type TherapistDetail,
	STATUS_LABELS,
	STATUS_BADGE_CLASS,
	DOCUMENT_TYPE_LABELS,
} from "@/types/therapist-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	therapistId: number | null;
	onApprove: () => void;
	onDecline: () => void;
}

export function TherapistDetailsSheet({
	open,
	onOpenChange,
	therapistId,
	onApprove,
	onDecline,
}: Props) {
	const [data, setData] = useState<TherapistDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const fetchDetail = useCallback(async () => {
		if (!therapistId) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/protected/therapists/${therapistId}`);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to load therapist");
			}
			const result = await res.json();
			setData(result.data);
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to load therapist",
			});
		} finally {
			setLoading(false);
		}
	}, [therapistId, toast]);

	useEffect(() => {
		if (open && therapistId) fetchDetail();
		if (!open) setData(null);
	}, [open, therapistId, fetchDetail]);

	const name =
		[data?.users?.first_name, data?.users?.last_name]
			.filter(Boolean)
			.join(" ") || "Therapist";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Therapist details</SheetTitle>
					<SheetDescription>
						Review the application and supporting documents.
					</SheetDescription>
				</SheetHeader>

				{loading || !data ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="mt-6 space-y-6">
						{/* Header */}
						<div className="flex items-center gap-4">
							<Avatar className="h-14 w-14">
								<AvatarImage
									src={data.users?.image_url || "/placeholder.svg"}
									alt={name}
								/>
								<AvatarFallback>{name.charAt(0)}</AvatarFallback>
							</Avatar>
							<div>
								<div className="text-lg font-semibold">{name}</div>
								<Badge
									variant="outline"
									className={STATUS_BADGE_CLASS[data.account_status]}
								>
									{STATUS_LABELS[data.account_status]}
								</Badge>
							</div>
						</div>

						{data.account_status === "rejected" && data.rejection_reason && (
							<div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
								<span className="font-medium">Decline reason:</span>{" "}
								{data.rejection_reason}
							</div>
						)}

						<Separator />

						{/* Contact */}
						<div className="space-y-3">
							<InfoRow icon={Mail} label="Email" value={data.users?.email} />
							<InfoRow
								icon={Phone}
								label="Phone"
								value={data.users?.phone_number}
							/>
							<InfoRow
								icon={Briefcase}
								label="Specialty"
								value={data.specialty}
							/>
							<InfoRow
								icon={Clock}
								label="Experience"
								value={
									data.experience_years != null
										? `${data.experience_years} years`
										: null
								}
							/>
							<InfoRow
								icon={MapPin}
								label="Areas covered"
								value={
									data.areas.length > 0
										? data.areas.map((a) => a.location_name).join(", ")
										: null
								}
							/>
						</div>

						{data.bio && (
							<>
								<Separator />
								<div>
									<div className="mb-1 text-sm font-medium">Bio</div>
									<p className="text-sm text-muted-foreground">{data.bio}</p>
								</div>
							</>
						)}

						<Separator />

						{/* Documents */}
						<div>
							<div className="mb-3 text-sm font-medium">
								Documents ({data.documents.length})
							</div>
							{data.documents.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No documents uploaded yet.
								</p>
							) : (
								<div className="space-y-2">
									{data.documents.map((doc) => (
										<div
											key={doc.id}
											className="flex items-center justify-between rounded-md border border-border p-3"
										>
											<div className="flex items-center gap-2 min-w-0">
												<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
												<div className="min-w-0">
													<div className="truncate text-sm font-medium">
														{DOCUMENT_TYPE_LABELS[doc.document_type] ||
															doc.document_type}
													</div>
													<div className="truncate text-xs text-muted-foreground">
														{doc.file_name}
													</div>
												</div>
											</div>
											{doc.signed_url ? (
												<Button variant="outline" size="sm" asChild>
													<a
														href={doc.signed_url}
														target="_blank"
														rel="noopener noreferrer"
													>
														<ExternalLink className="mr-1 h-3.5 w-3.5" />
														Open
													</a>
												</Button>
											) : (
												<span className="text-xs text-muted-foreground">
													Unavailable
												</span>
											)}
										</div>
									))}
								</div>
							)}
						</div>

						<Separator />

						{/* Reviews */}
						<div>
							<div className="mb-3 flex items-center gap-2 text-sm font-medium">
								<span>Patient reviews ({data.rating_count})</span>
								{data.rating_count > 0 && (
									<span className="flex items-center gap-1 text-amber-500">
										<Star className="h-4 w-4 fill-amber-500" />
										{data.rating_avg.toFixed(1)}
									</span>
								)}
							</div>
							{data.reviews.length === 0 ? (
								<p className="text-sm text-muted-foreground">No reviews yet.</p>
							) : (
								<div className="space-y-3">
									{data.reviews.map((review) => (
										<div
											key={review.id}
											className="rounded-md border border-border p-3"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-0.5">
													{Array.from({ length: 5 }).map((_, i) => (
														<Star
															key={i}
															className={
																i < review.rating
																	? "h-3.5 w-3.5 fill-amber-500 text-amber-500"
																	: "h-3.5 w-3.5 text-muted-foreground/30"
															}
														/>
													))}
												</div>
												<span className="text-xs text-muted-foreground">
													{new Date(review.created_at).toLocaleDateString(
														"en-US",
														{ year: "numeric", month: "short", day: "numeric" }
													)}
												</span>
											</div>
											{review.comment && (
												<p className="mt-2 text-sm text-foreground">
													{review.comment}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Actions */}
						<Separator />
						<div className="flex gap-3">
							<PermissionGate permissions={[Permission.ApproveTherapists]}>
								{data.account_status !== "approved" && (
									<Button
										className="flex-1 bg-green-600 hover:bg-green-700"
										onClick={onApprove}
									>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Approve
									</Button>
								)}
							</PermissionGate>
							<PermissionGate permissions={[Permission.DeclineTherapists]}>
								{data.account_status !== "rejected" && (
									<Button
										variant="destructive"
										className="flex-1"
										onClick={onDecline}
									>
										<XCircle className="mr-2 h-4 w-4" />
										Decline
									</Button>
								)}
							</PermissionGate>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

function InfoRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="flex items-start gap-3">
			<Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
			<div>
				<div className="text-xs text-muted-foreground">{label}</div>
				<div className="text-sm">{value || "—"}</div>
			</div>
		</div>
	);
}
