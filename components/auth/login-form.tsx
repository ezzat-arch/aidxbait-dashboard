"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/providers/user-provider";

const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters" }),
});

const otpSchema = z.object({
	otp: z.string().length(6, { message: "OTP must be 6 characters" }),
});

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [showOtpForm, setShowOtpForm] = useState(false);
	const [email, setEmail] = useState("");
	const router = useRouter();
	const { toast } = useToast();
	const { refreshUser } = useUserContext();

	const supabase = createClient();

	const loginForm = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const otpForm = useForm<z.infer<typeof otpSchema>>({
		resolver: zodResolver(otpSchema),
		defaultValues: {
			otp: "",
		},
	});

	async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
		setIsLoading(true);
		try {
			// Step 1: Sign in with email and password
			const { data: signInData, error: signInError } =
				await supabase.auth.signInWithPassword({
					email: values.email,
					password: values.password,
				});

			if (signInError) throw new Error(signInError.message);

			// Step 2: Check if user is an admin
			const { data: adminData, error: adminError } = await supabase
				.from("admins")
				.select("*")
				.eq("supabase_id", signInData.user?.id)
				.single();

			if (adminError || !adminData) {
				await supabase.auth.signOut();
				throw new Error("You are not authorized to access this dashboard");
			}

			// Step 3: Send OTP to email
			const { error: otpError } = await supabase.auth.signInWithOtp({
				email: values.email,
				options: {
					shouldCreateUser: false,
				},
			});

			if (otpError) throw new Error(otpError.message);

			setEmail(values.email);
			setShowOtpForm(true);
			toast({
				title: "OTP Sent",
				description: "Please check your email for the verification code",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to login",
			});
		} finally {
			setIsLoading(false);
		}
	}

	async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
		setIsLoading(true);
		try {
			// Verify OTP
			const { data, error } = await supabase.auth.verifyOtp({
				email,
				token: values.otp,
				type: "email",
			});

			if (error) throw new Error(error.message);

			// Refresh user context
			await refreshUser();

			toast({
				title: "Login Successful",
				description: "You have been logged in successfully",
			});

			router.push("/dashboard/users");
			router.refresh();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to verify OTP",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			{!showOtpForm ? (
				<Form {...loginForm}>
					<form
						onSubmit={loginForm.handleSubmit(onLoginSubmit)}
						className="space-y-4"
					>
						<FormField
							control={loginForm.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="email@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={loginForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="••••••••" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Logging in..." : "Login"}
						</Button>
					</form>
				</Form>
			) : (
				<Form {...otpForm}>
					<form
						onSubmit={otpForm.handleSubmit(onOtpSubmit)}
						className="space-y-4"
					>
						<FormField
							control={otpForm.control}
							name="otp"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Verification Code</FormLabel>
									<FormControl>
										<Input placeholder="123456" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex flex-col space-y-2">
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Verifying..." : "Verify"}
							</Button>
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => setShowOtpForm(false)}
								disabled={isLoading}
							>
								Back to Login
							</Button>
						</div>
					</form>
				</Form>
			)}
		</div>
	);
}
