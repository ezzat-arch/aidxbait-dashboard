"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from "@/components/ui/sheet";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { UserData, UserType } from "@/types/user-types";

const userFormSchema = z.object({
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	phone_number: z.string().min(1, "Phone number is required"),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
	user_type: z.enum(["patient", "therapist", "consultant", "admin", "superuser"]),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserData | null;
	onSuccess: () => void;
}

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
	{ value: "patient", label: "Patient" },
	{ value: "therapist", label: "Therapist" },
	{ value: "consultant", label: "Consultant" },
	{ value: "admin", label: "Admin" },
	{ value: "superuser", label: "Superuser" },
];

export function UserFormSheet({
	open,
	onOpenChange,
	user,
	onSuccess,
}: UserFormSheetProps) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const form = useForm<UserFormData>({
		resolver: zodResolver(userFormSchema),
		defaultValues: {
			first_name: "",
			last_name: "",
			phone_number: "",
			email: "",
			user_type: "patient",
		},
	});

	useEffect(() => {
		if (open && user) {
			form.reset({
				first_name: user.first_name || "",
				last_name: user.last_name || "",
				phone_number: user.phone_number || "",
				email: user.email || "",
				user_type: user.user_type,
			});
		} else if (!open) {
			form.reset({
				first_name: "",
				last_name: "",
				phone_number: "",
				email: "",
				user_type: "patient",
			});
		}
	}, [open, user, form]);

	const onSubmit = async (data: UserFormData) => {
		if (!user) return;

		try {
			setLoading(true);

			const response = await fetch(`/api/protected/users/${user.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					first_name: data.first_name,
					last_name: data.last_name,
					phone_number: data.phone_number,
					email: data.email || null,
					user_type: data.user_type,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update user");
			}

			toast({
				title: "Success",
				description: "User updated successfully",
			});

			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to update user",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-[480px] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Edit User</SheetTitle>
					<SheetDescription>
						Update user information. Click save when you&apos;re done.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 mt-6"
					>
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="first_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter first name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="last_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter last name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phone_number"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone Number</FormLabel>
										<FormControl>
											<Input placeholder="Enter phone number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email (Optional)</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="Enter email address"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="user_type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>User Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select user type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{USER_TYPE_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<SheetFooter className="pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? "Saving..." : "Save Changes"}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

