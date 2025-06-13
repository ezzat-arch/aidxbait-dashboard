import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { type Permission, Role } from "@/types/permission-types";
import {
	ROUTE_PERMISSIONS,
	API_PERMISSIONS,
} from "@/lib/rbac/permissions-config";

// Define protected routes and API paths
const PROTECTED_ROUTES = ["/dashboard", "/api/protected"];
const PUBLIC_ROUTES = ["/login", "/api/public"];
const API_ROUTES = ["/api/"];

export async function middleware(request: NextRequest) {
	const response = NextResponse.next();
	const supabase = createMiddlewareClient({ req: request, res: response });

	// Check if the session exists
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const requestPath = request.nextUrl.pathname;
	const requestMethod = request.method;

	// If no session, handle public/protected routes
	if (!session) {
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

		return response;
	}

	// User is authenticated, fetch their roles
	const { data: userRoles, error: rolesError } = await supabase
		.from("user_roles")
		.select(
			`
      role_id,
      roles (
        id,
        name
      )
    `
		)
		.eq("user_id", session.user.id);

	if (rolesError) {
		console.error("Error fetching user roles:", rolesError);
		// Default to no roles if there's an error
		const userRoleNames: Role[] = [];
	} else {
		// Extract role names
		const userRoleNames = userRoles?.map((ur) => ur.roles.name as Role) || [];

		// If no roles assigned, default to guest
		if (userRoleNames.length === 0) {
			userRoleNames.push(Role.Guest);
		}

		// Handle API routes - add auth headers
		if (requestPath.startsWith("/api/")) {
			// Add auth headers to API requests
			response.headers.set("x-user-id", session.user.id);
			response.headers.set("x-user-email", session.user.email || "");
			response.headers.set("x-user-roles", JSON.stringify(userRoleNames));
			response.headers.set("Authorization", `Bearer ${session.access_token}`);

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
						session.user.id,
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

			return response;
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
				session.user.id,
				requiredPermissions
			);

			if (!hasPermission) {
				return NextResponse.redirect(
					new URL("/dashboard/unauthorized", request.url)
				);
			}
		}
	}

	// If user is authenticated and trying to access login page, redirect to dashboard
	if (isPublicRoute(requestPath)) {
		return NextResponse.redirect(new URL("/dashboard/users", request.url));
	}

	return response;
}

// Helper function to check if a user has any of the required permissions
async function checkUserPermissions(
	supabase: any,
	userId: string,
	requiredPermissions: Permission[]
): Promise<boolean> {
	try {
		// Get user roles
		const { data: userRoles, error: rolesError } = await supabase
			.from("user_roles")
			.select(
				`
        roles (
          id,
          name
        )
      `
			)
			.eq("user_id", userId);

		if (rolesError) throw rolesError;

		// Extract role names
		const roleNames = userRoles?.map((ur) => ur.roles.name as Role) || [];

		// If no roles, default to guest
		if (roleNames.length === 0) {
			roleNames.push(Role.Guest);
		}

		// Get permissions for these roles
		const { data: rolePermissions, error: permissionsError } = await supabase
			.from("role_permissions")
			.select(
				`
        permissions (
          name
        )
      `
			)
			.in(
				"role_id",
				userRoles.map((ur) => ur.roles.id)
			);

		if (permissionsError) throw permissionsError;

		// Extract permission names
		const permissionNames =
			rolePermissions?.map((rp) => rp.permissions.name as Permission) || [];

		// Check if user has any of the required permissions
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
