"use client";

import { useState, useEffect } from "react";
import {
	User,
	Mail,
	Phone,
	Calendar,
	MapPin,
	Heart,
	Globe,
	Shield,
	Briefcase,
	Clock,
	FileText,
	BadgeCheck,
	Languages,
	Loader2,
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
import type {
	UserData,
	UserDetails,
	PatientData,
	ConsultantData,
	PatientAddressData,
} from "@/types/user-types";

interface UserDetailsSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserData | null;
}

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return "N/A";
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatDateTime(dateString: string | null | undefined) {
	if (!dateString) return "N/A";
	return new Date(dateString).toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function calculateAge(dateOfBirth: string | null | undefined): string {
	if (!dateOfBirth) return "N/A";
	const today = new Date();
	const birthDate = new Date(dateOfBirth);
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return `${age} years`;
}

function DetailRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-start gap-3 py-2">
			<Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
			<div className="flex-1 min-w-0">
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-sm font-medium break-words">{value || "N/A"}</p>
			</div>
		</div>
	);
}

function SectionHeader({ title }: { title: string }) {
	return (
		<div className="pt-4 pb-2">
			<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
				{title}
			</h3>
			<Separator className="mt-2" />
		</div>
	);
}

function PatientDetails({ patient, addresses }: { patient: PatientData; addresses?: PatientAddressData[] }) {
	return (
		<>
			<SectionHeader title="Patient Information" />
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
				<DetailRow
					icon={Calendar}
					label="Date of Birth"
					value={`${formatDate(patient.date_of_birth)} (${calculateAge(patient.date_of_birth)})`}
				/>
				<DetailRow
					icon={User}
					label="Gender"
					value={patient.gender}
				/>
				<DetailRow
					icon={Heart}
					label="Blood Type"
					value={patient.blood_type}
				/>
				<DetailRow
					icon={User}
					label="Marital Status"
					value={patient.marital_status}
				/>
				<DetailRow
					icon={Globe}
					label="Preferred Language"
					value={patient.preferred_language}
				/>
				<DetailRow
					icon={FileText}
					label="National ID"
					value={patient.national_id}
				/>
			</div>

			{patient.has_insurance && (
				<>
					<SectionHeader title="Insurance Information" />
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
						<DetailRow
							icon={Shield}
							label="Insurance Provider"
							value={patient.insurance_provider}
						/>
						<DetailRow
							icon={FileText}
							label="Insurance Number"
							value={patient.insurance_number}
						/>
					</div>
				</>
			)}

			{patient.notes && (
				<>
					<SectionHeader title="Notes" />
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">
						{patient.notes}
					</p>
				</>
			)}

			{addresses && addresses.length > 0 && (
				<>
					<SectionHeader title="Addresses" />
					<div className="space-y-3">
						{addresses.map((address) => (
							<div
								key={address.id}
								className="p-3 rounded-lg border bg-muted/30"
							>
								<div className="flex items-center gap-2 mb-2">
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium text-sm">
										{address.address_label}
									</span>
									{address.is_primary && (
										<Badge variant="secondary" className="text-xs">
											Primary
										</Badge>
									)}
									<Badge variant="outline" className="text-xs">
										{address.address_type}
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground">
									{[
										address.street,
										address.building_name,
										address.floor && `Floor ${address.floor}`,
										address.apartment && `Apt ${address.apartment}`,
									]
										.filter(Boolean)
										.join(", ")}
								</p>
								<p className="text-sm text-muted-foreground">
									{address.city}, {address.governorate}
								</p>
								{address.additional_directions && (
									<p className="text-xs text-muted-foreground mt-1 italic">
										{address.additional_directions}
									</p>
								)}
							</div>
						))}
					</div>
				</>
			)}
		</>
	);
}

function ConsultantDetails({ consultant }: { consultant: ConsultantData }) {
	return (
		<>
			<SectionHeader title="Consultant Information" />
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
				<DetailRow
					icon={Briefcase}
					label="Specialization"
					value={
						<span className="capitalize">
							{consultant.specialization}
						</span>
					}
				/>
				<DetailRow
					icon={Clock}
					label="Experience"
					value={`${consultant.experience_years} years`}
				/>
				<DetailRow
					icon={BadgeCheck}
					label="Availability"
					value={
						<Badge
							variant="outline"
							className={
								consultant.is_available
									? "bg-green-500/20 text-green-500"
									: "bg-red-500/20 text-red-500"
							}
						>
							{consultant.is_available ? "Available" : "Unavailable"}
						</Badge>
					}
				/>
				<DetailRow
					icon={Languages}
					label="Languages"
					value={consultant.languages_spoken?.join(", ")}
				/>
			</div>

			{consultant.bio && (
				<>
					<SectionHeader title="Bio" />
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">
						{consultant.bio}
					</p>
				</>
			)}

			{consultant.credentials && (
				<>
					<SectionHeader title="Credentials" />
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">
						{consultant.credentials}
					</p>
				</>
			)}

			{consultant.certifications && (
				<>
					<SectionHeader title="Certifications" />
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">
						{consultant.certifications}
					</p>
				</>
			)}
		</>
	);
}

function getRoleBadgeColor(userType: string): string {
	switch (userType) {
		case "superuser":
			return "bg-purple-500/20 text-purple-500 border-purple-500/30";
		case "admin":
			return "bg-blue-500/20 text-blue-500 border-blue-500/30";
		case "consultant":
			return "bg-amber-500/20 text-amber-500 border-amber-500/30";
		case "therapist":
			return "bg-teal-500/20 text-teal-500 border-teal-500/30";
		case "patient":
		default:
			return "bg-green-500/20 text-green-500 border-green-500/30";
	}
}

export function UserDetailsSheet({
	open,
	onOpenChange,
	user,
}: UserDetailsSheetProps) {
	const [loading, setLoading] = useState(false);
	const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		if (open && user) {
			fetchUserDetails();
		} else if (!open) {
			setUserDetails(null);
		}
	}, [open, user?.id]);

	const fetchUserDetails = async () => {
		if (!user) return;

		try {
			setLoading(true);
			const response = await fetch(`/api/protected/users/${user.id}`);

			if (!response.ok) {
				throw new Error("Failed to fetch user details");
			}

			const result = await response.json();
			setUserDetails(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to load user details",
			});
		} finally {
			setLoading(false);
		}
	};

	const userName = userDetails
		? [userDetails.first_name, userDetails.last_name].filter(Boolean).join(" ") ||
		  "No name"
		: "Loading...";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-[540px] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>User Details</SheetTitle>
					<SheetDescription>
						View complete information about this user.
					</SheetDescription>
				</SheetHeader>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : userDetails ? (
					<div className="mt-6 space-y-1">
						{/* Header Section */}
						<div className="flex items-center gap-4 pb-4">
							<Avatar className="h-16 w-16">
								<AvatarImage
									src={userDetails.image_url || "/placeholder.svg"}
									alt={userName}
								/>
								<AvatarFallback className="text-lg">
									{userDetails.first_name?.charAt(0) ||
										userDetails.last_name?.charAt(0) ||
										"U"}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<h2 className="text-xl font-semibold truncate">{userName}</h2>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant="outline"
										className={getRoleBadgeColor(userDetails.user_type)}
									>
										<span className="capitalize">{userDetails.user_type}</span>
									</Badge>
									{userDetails.is_website_user && (
										<Badge variant="secondary" className="text-xs">
											Website User
										</Badge>
									)}
								</div>
							</div>
						</div>

						<Separator />

						{/* Contact Information */}
						<SectionHeader title="Contact Information" />
						<div className="grid grid-cols-1 gap-x-4">
							<DetailRow
								icon={Mail}
								label="Email Address"
								value={userDetails.email}
							/>
							<DetailRow
								icon={Phone}
								label="Phone Number"
								value={userDetails.phone_number}
							/>
						</div>

						{/* Role-specific sections */}
						{userDetails.user_type === "patient" && userDetails.patient && (
							<PatientDetails
								patient={userDetails.patient}
								addresses={userDetails.patient_addresses || undefined}
							/>
						)}

						{userDetails.user_type === "consultant" && userDetails.consultant && (
							<ConsultantDetails consultant={userDetails.consultant} />
						)}

						{userDetails.user_type === "therapist" && userDetails.therapist && (
							<>
								<SectionHeader title="Therapist Information" />
								<p className="text-sm text-muted-foreground">
									Therapist profile created on{" "}
									{formatDate(userDetails.therapist.created_at)}.
								</p>
							</>
						)}

						{userDetails.user_type === "admin" && userDetails.admin && (
							<>
								<SectionHeader title="Admin Information" />
								<p className="text-sm text-muted-foreground">
									Admin account created on{" "}
									{formatDate(userDetails.admin.created_at)}.
								</p>
							</>
						)}

						{userDetails.user_type === "superuser" && userDetails.superuser && (
							<>
								<SectionHeader title="Superuser Information" />
								<p className="text-sm text-muted-foreground">
									Superuser account created on{" "}
									{formatDate(userDetails.superuser.created_at)}.
								</p>
							</>
						)}

						{/* Account Metadata */}
						<SectionHeader title="Account Information" />
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
							<DetailRow
								icon={Calendar}
								label="Created At"
								value={formatDateTime(userDetails.created_at)}
							/>
							<DetailRow
								icon={Clock}
								label="Last Updated"
								value={formatDateTime(userDetails.updated_at)}
							/>
						</div>

						{/* Close Button */}
						<div className="pt-6">
							<Button
								variant="outline"
								className="w-full"
								onClick={() => onOpenChange(false)}
							>
								Close
							</Button>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center py-12 text-muted-foreground">
						No user selected
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

