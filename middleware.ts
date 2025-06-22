import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { type Permission, Role } from "@/types/permission-types";
import {
	ROUTE_PERMISSIONS,
	API_PERMISSIONS,
} from "@/lib/rbac/permissions-config";
import { getPermissionsForRoles } from "@/lib/rbac/permissions";

// Define protected routes and API paths
const PROTECTED_ROUTES = ["/dashboard", "/api/protected"];
const PUBLIC_ROUTES = ["/login", "/api/public"];
const API_ROUTES = ["/api/"];

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: { path?: string }) {
					const cookieOptions = {
						name,
						value,
						...options,
					};
					request.cookies.set(cookieOptions);
					supabaseResponse = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					supabaseResponse.cookies.set(cookieOptions);
				},
				remove(name: string, options: { path?: string }) {
					const cookieOptions = {
						name,
						value: "",
						...options,
					};
					request.cookies.set(cookieOptions);
					supabaseResponse = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					supabaseResponse.cookies.set(cookieOptions);
				},
			},
		}
	);

	// Check if the user exists (more secure than getSession)
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	const requestPath = request.nextUrl.pathname;
	const requestMethod = request.method;

	// If no user or auth error, handle public/protected routes
	if (!user || authError) {
		// For API routes, return 401 if protected
		if (requestPath.startsWith("/api/") && isProtectedRoute(requestPath)) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// For non-API routes, redirect to login if protected
		if (isProtectedRoute(requestPath) && !isPublicRoute(requestPath)) {
			const redirectUrl = new URL("/login", request.url);
			redirectUrl.searchParams.set("redirectUrl", requestPath);
			return NextResponse.redirect(redirectUrl);
		}

		return supabaseResponse;
	}

	// Fetch user record
	const { data: userRecord, error: userError } = await supabase
		.from("users")
		.select("*")
		.eq("supabase_id", user.id)
		.single();

	if (userError || !userRecord) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const userRoleNames: Role[] = [userRecord.user_type as Role];

	if (
		userRecord.user_type !== "admin" &&
		userRecord.user_type !== "superuser"
	) {
		return NextResponse.redirect(
			new URL("/login?error=unauthorized", request.url)
		);
	}

	// Handle API routes - add auth headers
	if (requestPath.startsWith("/api/")) {
		// Add auth headers to API requests
		supabaseResponse.headers.set("x-user-id", user.id);
		supabaseResponse.headers.set("x-user-email", user.email || "");
		supabaseResponse.headers.set("x-user-roles", JSON.stringify(userRoleNames));

		// For protected API routes, check permissions
		if (isProtectedRoute(requestPath)) {
			const apiKey = `${requestMethod} ${requestPath}`;

			// Find matching API permission configuration
			const matchingApiRoutes = Object.keys(API_PERMISSIONS)
				.filter((pattern) => {
					const [patternMethod, patternPath] = pattern.split(" ");
					return (
						patternMethod === requestMethod &&
						requestPath.startsWith(patternPath)
					);
				})
				.sort((a, b) => {
					const pathA = a.split(" ")[1];
					const pathB = b.split(" ")[1];
					return pathB.length - pathA.length; // Sort by specificity (longest path first)
				});

			if (matchingApiRoutes.length > 0) {
				const requiredPermissions = API_PERMISSIONS[matchingApiRoutes[0]];

				// Check if user has any of the required permissions based on their roles
				const hasPermission = await checkUserPermissions(
					supabase,
					userRoleNames,
					requiredPermissions
				);

				if (!hasPermission) {
					return NextResponse.json(
						{ error: "Insufficient permissions" },
						{ status: 403 }
					);
				}
			}
		}

		return supabaseResponse;
	}

	// For non-API routes, check route permissions
	const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
		.filter((pattern) => requestPath.startsWith(pattern))
		.sort((a, b) => b.length - a.length); // Sort by specificity (longest first)

	if (matchingRoutes.length > 0) {
		const requiredPermissions = ROUTE_PERMISSIONS[matchingRoutes[0]];

		// Check if user has any of the required permissions
		const hasPermission = await checkUserPermissions(
			supabase,
			userRoleNames,
			requiredPermissions
		);

		if (!hasPermission) {
			return NextResponse.redirect(
				new URL("/dashboard/unauthorized", request.url)
			);
		}
	}

	// If user is authenticated and trying to access login page, redirect to dashboard
	if (isPublicRoute(requestPath)) {
		return NextResponse.redirect(new URL("/dashboard/users", request.url));
	}

	return supabaseResponse;
}

// Helper function to check if a user has any of the required permissions
async function checkUserPermissions(
	_supabase: any,
	userRoles: Role[],
	requiredPermissions: Permission[]
): Promise<boolean> {
	try {
		const permissionNames = getPermissionsForRoles(userRoles);
		return requiredPermissions.some((permission) =>
			permissionNames.includes(permission)
		);
	} catch (error) {
		console.error("Error checking user permissions:", error);
		return false;
	}
}

// Helper functions to check route types
function isProtectedRoute(path: string): boolean {
	return PROTECTED_ROUTES.some((route) => path.startsWith(route));
}

function isPublicRoute(path: string): boolean {
	return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

// Configure middleware to run on specific paths
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
