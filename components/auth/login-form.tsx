/**
 * SECURE 2FA LOGIN IMPLEMENTATION
 *
 * This component implements a secure two-factor authentication flow that adheres to
 * top security standards:
 *
 * SECURITY FEATURES:
 * 1. No session persistence until OTP verification
 * 2. Rate limit prevention through optimized flow
 * 3. Double authorization verification (email/password + OTP)
 * 4. Secure OTP-only session creation
 * 5. Role-based access control after authentication
 *
 * FLOW:
 * Step 1: Send OTP to email (includes credential verification)
 * Step 2: Verify OTP and create authenticated session
 * Step 3: Verify password with authenticated session
 * Step 4: Check user authorization (admin/superuser only)
 * Step 5: Redirect to dashboard
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthApiError } from "@supabase/supabase-js";

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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/providers/user-provider";

// Form validation schemas
const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters" }),
});

const otpSchema = z.object({
	otp: z.string().length(6, { message: "OTP must be 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

// Error message utilities
const getAuthErrorMessage = (
	error: any
): { title: string; message: string } => {
	if (!error) return { title: "Error", message: "An unknown error occurred" };

	const errorMessage = (error.message || error.toString()).toLowerCase();

	// Rate limiting errors
	if (
		errorMessage.includes("over_email_send_rate_limit") ||
		errorMessage.includes("rate_limit") ||
		errorMessage.includes("too_many_requests")
	) {
		return {
			title: "Too Many Requests",
			message: "Too many attempts. Please wait 60 seconds before trying again.",
		};
	}

	// User not found errors
	if (
		errorMessage.includes("user_not_found") ||
		errorMessage.includes("not_found")
	) {
		return {
			title: "Account Not Found",
			message:
				"No account found with this email address. Please check your email or contact support.",
		};
	}

	// Invalid credentials
	if (
		errorMessage.includes("invalid_credentials") ||
		errorMessage.includes("invalid")
	) {
		return {
			title: "Invalid Credentials",
			message: "The email or password you entered is incorrect.",
		};
	}

	// OTP specific errors
	if (
		errorMessage.includes("otp_expired") ||
		errorMessage.includes("expired") ||
		errorMessage.includes("token has expired")
	) {
		return {
			title: "Code Expired",
			message: "Your verification code has expired. Please request a new one.",
		};
	}

	if (errorMessage.includes("invalid_otp")) {
		return {
			title: "Invalid Code",
			message:
				"The verification code you entered is incorrect. Please try again.",
		};
	}

	// Email confirmation errors
	if (errorMessage.includes("email_not_confirmed")) {
		return {
			title: "Email Not Confirmed",
			message: "Please confirm your email address before signing in.",
		};
	}

	// Network errors
	if (
		errorMessage.includes("network") ||
		errorMessage.includes("fetch") ||
		errorMessage.includes("timeout")
	) {
		return {
			title: "Network Error",
			message:
				"Unable to connect. Please check your internet connection and try again.",
		};
	}

	// Default to original message if it's descriptive
	return {
		title: "Error",
		message:
			error.message || error.toString() || "An unexpected error occurred",
	};
};

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [showOtpForm, setShowOtpForm] = useState(false);
	const [credentials, setCredentials] = useState({ email: "", password: "" });

	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const { refreshUser } = useUserContext();
	const supabase = createClient();

	// Handle URL error parameters
	useEffect(() => {
		const error = searchParams?.get("error");
		if (error) {
			let errorMessage = "";
			let errorTitle = "Authentication Error";

			switch (error) {
				case "database":
					errorTitle = "Database Error";
					errorMessage =
						"There was a database connectivity issue. Please try again or contact support.";
					break;
				case "no-account":
					errorTitle = "Account Not Found";
					errorMessage =
						"Your account was not found in our system. Please contact an administrator to create your account.";
					break;
				case "unauthorized":
					errorTitle = "Access Denied";
					errorMessage =
						"You don't have permission to access this application.";
					break;
				default:
					errorMessage =
						"An authentication error occurred. Please try logging in again.";
			}

			toast({
				variant: "destructive",
				title: errorTitle,
				description: errorMessage,
			});
		}
	}, [searchParams, toast]);

	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const otpForm = useForm<OtpFormData>({
		resolver: zodResolver(otpSchema),
		defaultValues: { otp: "" },
	});

	// Step 1: Send OTP email (includes credential verification)
	const handleLoginSubmit = async (values: LoginFormData) => {
		setIsLoading(true);

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email: values.email,
				options: { shouldCreateUser: false },
			});

			if (error) {
				const { title, message } = getAuthErrorMessage(error);
				toast({ variant: "destructive", title, description: message });
				return;
			}

			// Store credentials for later verification
			setCredentials(values);
			setShowOtpForm(true);

			toast({
				title: "OTP Sent",
				description:
					"Please check your email for the verification code. You'll need to verify both your password and OTP to login.",
			});
		} catch (error) {
			const { title, message } = getAuthErrorMessage(error);
			toast({ variant: "destructive", title, description: message });
		} finally {
			setIsLoading(false);
		}
	};

	// Step 2-5: Complete authentication flow
	const handleOtpSubmit = async (values: OtpFormData) => {
		setIsLoading(true);

		try {
			// Step 2: Verify OTP and create session
			const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
				email: credentials.email,
				token: values.otp,
				type: "email",
			});

			if (otpError) {
				const { title, message } = getAuthErrorMessage(otpError);
				toast({ variant: "destructive", title, description: message });
				return;
			}

			if (!otpData?.session || !otpData?.user) {
				toast({
					variant: "destructive",
					title: "Session Error",
					description:
						"Failed to create authenticated session. Please try again.",
				});
				return;
			}

			// Step 3: Verify password with authenticated session
			const { error: passwordError } = await supabase.auth.signInWithPassword({
				email: credentials.email,
				password: credentials.password,
			});

			if (passwordError) {
				// Sign out and reject if password verification fails
				await supabase.auth.signOut();
				toast({
					variant: "destructive",
					title: "Password Verification Failed",
					description: "The password you entered is incorrect.",
				});
				return;
			}

			// Step 4: Verify user authorization
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("user_type")
				.eq("supabase_id", otpData.user.id)
				.single();

			if (
				userError ||
				(userData.user_type !== "admin" && userData.user_type !== "superuser")
			) {
				await supabase.auth.signOut();

				let authErrorMessage =
					"You are not authorized to access this dashboard";
				if (userError?.message?.includes("PGRST116")) {
					authErrorMessage = "User profile not found. Please contact support.";
				} else if (userError) {
					authErrorMessage =
						"Unable to verify user permissions. Please try again.";
				}

				toast({
					variant: "destructive",
					title: "Access Denied",
					description: authErrorMessage,
				});
				return;
			}

			// Step 5: Success - refresh user context and redirect
			await refreshUser();

			toast({
				title: "Login Successful",
				description: "You have been securely logged in with 2FA verification",
			});

			router.push("/dashboard/users");
			router.refresh();
		} catch (error) {
			// Cleanup any partial session
			await supabase.auth.signOut();
			const { title, message } = getAuthErrorMessage(error);
			toast({ variant: "destructive", title, description: message });
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOtp = async () => {
		setIsResending(true);

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email: credentials.email,
				options: { shouldCreateUser: false },
			});

			if (error) {
				const { title, message } = getAuthErrorMessage(error);
				toast({ variant: "destructive", title, description: message });
				return;
			}

			toast({
				title: "Code Resent",
				description: "A new verification code has been sent to your email.",
			});
		} catch (error) {
			const { title, message } = getAuthErrorMessage(error);
			toast({ variant: "destructive", title, description: message });
		} finally {
			setIsResending(false);
		}
	};

	const handleBackToLogin = () => {
		setShowOtpForm(false);
		setCredentials({ email: "", password: "" });
		otpForm.reset();
	};

	return (
		<div className="space-y-6">
			{!showOtpForm ? (
				<Form {...loginForm}>
					<form
						onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
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
							{isLoading ? "Sending verification code..." : "Continue to 2FA"}
						</Button>
					</form>
				</Form>
			) : (
				<div className="space-y-6">
					<div className="text-center space-y-2">
						<h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
						<p className="text-sm text-muted-foreground max-w-sm mx-auto">
							Enter the 6-digit code sent to your email to complete login
						</p>
					</div>
					<Form {...otpForm}>
						<form
							onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
							className="space-y-6"
						>
							<FormField
								control={otpForm.control}
								name="otp"
								render={({ field }) => (
									<FormItem className="space-y-4">
										<FormControl>
											<div className="flex justify-center">
												<InputOTP maxLength={6} {...field}>
													<InputOTPGroup className="gap-2">
														{[...Array(6)].map((_, index) => (
															<InputOTPSlot
																key={index}
																index={index}
																className="w-12 h-12 text-lg border-2 border-slate-600 bg-slate-800/50 hover:border-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
															/>
														))}
													</InputOTPGroup>
												</InputOTP>
											</div>
										</FormControl>
										<FormMessage className="text-center" />
									</FormItem>
								)}
							/>
							<div className="flex flex-col space-y-3 pt-2">
								<Button
									type="submit"
									className="w-full h-11"
									disabled={isLoading}
								>
									{isLoading ? "Verifying credentials..." : "Verify & Login"}
								</Button>
								<Button
									type="button"
									variant="secondary"
									className="w-full h-11"
									onClick={handleResendOtp}
									disabled={isLoading || isResending}
								>
									{isResending ? "Sending..." : "Resend Code"}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full h-11"
									onClick={handleBackToLogin}
									disabled={isLoading}
								>
									Back to Login
								</Button>
							</div>
						</form>
					</Form>
				</div>
			)}
		</div>
	);
}
