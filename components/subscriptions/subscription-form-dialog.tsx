"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
	CreateSubscriptionData,
	ProgramSubscriptionWithDetails,
	Patient,
	Program,
	Payment,
} from "@/types/subscription-types";

const subscriptionSchema = z.object({
	patient_id: z.string().min(1, "Patient is required"),
	program_id: z.string().min(1, "Program is required"),
	payment_id: z.string().min(1, "Payment is required"),
	start_date: z.string().min(1, "Start date is required"),
	end_date: z.string().min(1, "End date is required"),
	is_active: z.boolean(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscription?: ProgramSubscriptionWithDetails;
	onSuccess?: () => void;
}

export function SubscriptionFormDialog({
	open,
	onOpenChange,
	subscription,
	onSuccess,
}: SubscriptionFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [patients, setPatients] = useState<Patient[]>([]);
	const [programs, setPrograms] = useState<Program[]>([]);
	const [payments, setPayments] = useState<Payment[]>([]);
	const [selectedPatient, setSelectedPatient] = useState<string>("");
	const [selectedProgram, setSelectedProgram] = useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<SubscriptionFormData>({
		resolver: zodResolver(subscriptionSchema),
		defaultValues: {
			patient_id: "",
			program_id: "",
			payment_id: "",
			start_date: "",
			end_date: "",
			is_active: true,
		},
	});

	const selectedPatientId = watch("patient_id");
	const selectedProgramId = watch("program_id");

	// Load initial data
	useEffect(() => {
		if (open) {
			loadInitialData();
		}
	}, [open]);

	// Load patient payments when patient changes
	useEffect(() => {
		if (selectedPatientId) {
			loadPatientPayments(selectedPatientId);
		} else {
			setPayments([]);
		}
	}, [selectedPatientId]);

	// Calculate end date when program changes
	useEffect(() => {
		if (selectedProgramId) {
			const program = programs.find(
				(p) => p.id === parseInt(selectedProgramId)
			);
			if (program) {
				const startDate = watch("start_date");
				if (startDate) {
					const start = new Date(startDate);
					const end = new Date(
						start.getTime() + program.duration_days * 24 * 60 * 60 * 1000
					);
					setValue("end_date", end.toISOString().split("T")[0]);
				}
			}
		}
	}, [selectedProgramId, programs, watch("start_date")]);

	const loadInitialData = async () => {
		try {
			const [patientsRes, programsRes] = await Promise.all([
				fetch("/api/protected/patients"),
				fetch("/api/protected/exercise-programs/programs"),
			]);

			if (patientsRes.ok) {
				const patientsData = await patientsRes.json();
				setPatients(patientsData.data || []);
			}

			if (programsRes.ok) {
				const programsData = await programsRes.json();
				setPrograms(programsData.data || []);
			}
		} catch (error) {
			console.error("Error loading initial data:", error);
			toast({
				title: "Error",
				description: "Failed to load form data",
				variant: "destructive",
			});
		}
	};

	const loadPatientPayments = async (patientId: string) => {
		try {
			const response = await fetch(
				`/api/protected/payments?patient_id=${patientId}`
			);
			if (response.ok) {
				const data = await response.json();
				setPayments(data.data || []);
			}
		} catch (error) {
			console.error("Error loading patient payments:", error);
		}
	};

	const onSubmit = async (data: SubscriptionFormData) => {
		setIsLoading(true);
		try {
			const subscriptionData: CreateSubscriptionData = {
				patient_id: parseInt(data.patient_id),
				program_id: parseInt(data.program_id),
				payment_id: parseInt(data.payment_id),
				start_date: new Date(data.start_date).toISOString(),
				end_date: new Date(data.end_date).toISOString(),
				is_active: data.is_active,
			};

			const url = subscription
				? `/api/protected/exercise-programs/subscriptions/${subscription.id}`
				: "/api/protected/exercise-programs/subscriptions";

			const response = await fetch(url, {
				method: subscription ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(subscriptionData),
			});

			if (response.ok) {
				toast({
					title: "Success",
					description: `Subscription ${
						subscription ? "updated" : "created"
					} successfully`,
				});
				onSuccess?.();
				handleClose();
			} else {
				const error = await response.json();
				toast({
					title: "Error",
					description: error.error || "Failed to save subscription",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error saving subscription:", error);
			toast({
				title: "Error",
				description: "Failed to save subscription",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		reset();
		setSelectedPatient("");
		setSelectedProgram("");
		setPayments([]);
		onOpenChange(false);
	};

	// Pre-fill form when editing
	useEffect(() => {
		if (subscription && open) {
			setValue("patient_id", subscription.patient_id.toString());
			setValue("program_id", subscription.program_id.toString());
			setValue("payment_id", subscription.payment_id.toString());
			setValue("start_date", subscription.start_date.split("T")[0]);
			setValue("end_date", subscription.end_date.split("T")[0]);
			setValue("is_active", subscription.is_active);
		}
	}, [subscription, open, setValue]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{subscription ? "Edit Subscription" : "Create New Subscription"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="patient_id">Patient</Label>
							<Select
								value={selectedPatientId}
								onValueChange={(value) => setValue("patient_id", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select patient" />
								</SelectTrigger>
								<SelectContent>
									{patients.map((patient) => (
										<SelectItem key={patient.id} value={patient.id.toString()}>
											{patient.name} ({patient.email})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.patient_id && (
								<p className="text-sm text-red-600">
									{errors.patient_id.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="program_id">Program</Label>
							<Select
								value={selectedProgramId}
								onValueChange={(value) => setValue("program_id", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select program" />
								</SelectTrigger>
								<SelectContent>
									{programs.map((program) => (
										<SelectItem key={program.id} value={program.id.toString()}>
											{program.name} ({program.duration_days} days)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.program_id && (
								<p className="text-sm text-red-600">
									{errors.program_id.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="payment_id">Payment</Label>
							<Select
								value={watch("payment_id")}
								onValueChange={(value) => setValue("payment_id", value)}
								disabled={!selectedPatientId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select payment" />
								</SelectTrigger>
								<SelectContent>
									{payments.map((payment) => (
										<SelectItem key={payment.id} value={payment.id.toString()}>
											{payment.amount} {payment.currency} - {payment.status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.payment_id && (
								<p className="text-sm text-red-600">
									{errors.payment_id.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="start_date">Start Date</Label>
							<Input
								id="start_date"
								type="date"
								{...register("start_date")}
								onChange={(e) => setValue("start_date", e.target.value)}
							/>
							{errors.start_date && (
								<p className="text-sm text-red-600">
									{errors.start_date.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="end_date">End Date</Label>
							<Input id="end_date" type="date" {...register("end_date")} />
							{errors.end_date && (
								<p className="text-sm text-red-600">
									{errors.end_date.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Switch
									id="is_active"
									checked={watch("is_active")}
									onCheckedChange={(checked) => setValue("is_active", checked)}
								/>
								<Label htmlFor="is_active">Active</Label>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{subscription ? "Update" : "Create"} Subscription
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
