/**
 * DIRECT LOGIN IMPLEMENTATION
 *
 * FLOW:
 * Step 1: Sign in with email/password
 * Step 2: Check user authorization (admin/superuser only)
 * Step 3: Redirect to dashboard
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type LoginFormData = z.infer<typeof loginSchema>;

// Error message utilities
const getAuthErrorMessage = (
	error: any
): { title: string; message: string } => {
	if (!error) return { title: "Error", message: "An unknown error occurred" };

	const errorMessage = (error.message || error.toString()).toLowerCase();

	// Rate limiting errors
	if (
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

	// Direct login: password sign-in, authorization check, redirect
	const handleLoginSubmit = async (values: LoginFormData) => {
		setIsLoading(true);

		try {
			// Step 1: Sign in with email/password
			const { data: signInData, error: signInError } =
				await supabase.auth.signInWithPassword({
					email: values.email,
					password: values.password,
				});

			if (signInError) {
				const { title, message } = getAuthErrorMessage(signInError);
				toast({ variant: "destructive", title, description: message });
				return;
			}

			if (!signInData?.session || !signInData?.user) {
				toast({
					variant: "destructive",
					title: "Session Error",
					description:
						"Failed to create authenticated session. Please try again.",
				});
				return;
			}

			// Step 2: Verify user authorization
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("user_type")
				.eq("supabase_id", signInData.user.id)
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

			// Step 3: Success - refresh user context and redirect
			await refreshUser();

			toast({
				title: "Login Successful",
				description: "You have been logged in successfully",
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

	return (
		<div className="space-y-6">
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
						{isLoading ? "Signing in..." : "Sign In"}
					</Button>
				</form>
			</Form>
		</div>
	);
}
