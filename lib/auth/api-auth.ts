import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Permission } from "@/types/permission-types";

export type AuthenticatedHandler = (
	req: NextRequest,
	context: { params: Record<string, string> },
	user: { id: string; email: string; roles: string[]; permissions: string[] }
) => Promise<NextResponse | Response>;

/**
 * Higher-order function that wraps an API route handler with authentication
 * @param handler The route handler function to wrap
 * @returns A wrapped handler that checks authentication before executing
 */
export function withAuth(handler: AuthenticatedHandler) {
	return async (
		req: NextRequest,
		context: { params: Record<string, string> }
	) => {
		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Check if user is an admin
		const { data: adminData, error: adminError } = await supabase
			.from("admins")
			.select("*")
			.eq("supabase_id", session.user.id)
			.single();

		if (adminError || !adminData) {
			return NextResponse.json(
				{ error: "Unauthorized access" },
				{ status: 403 }
			);
		}

		// Get user roles
		const { data: userRoles, error: rolesError } = await supabase
			.from("user_roles")
			.select(
				`
        roles (
          name
        )
      `
			)
			.eq("user_id", adminData.id);

		if (rolesError) {
			console.error("Error fetching user roles:", rolesError);
			return NextResponse.json(
				{ error: "Error fetching user roles" },
				{ status: 500 }
			);
		}

		// Extract role names
		const roles = userRoles?.map((ur) => ur.roles.name) || [];

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

		if (permissionsError) {
			console.error("Error fetching permissions:", permissionsError);
			return NextResponse.json(
				{ error: "Error fetching permissions" },
				{ status: 500 }
			);
		}

		// Extract permission names
		const permissions = rolePermissions?.map((rp) => rp.permissions.name) || [];

		// Pass the authenticated user with roles and permissions to the handler
		const user = {
			id: session.user.id,
			email: session.user.email || "",
			roles,
			permissions,
		};

		return handler(req, context, user);
	};
}

/**
 * Higher-order function that wraps an API route handler with permission check
 * @param requiredPermissions Permissions required to access this endpoint
 * @param handler The route handler function to wrap
 * @returns A wrapped handler that checks permissions before executing
 */
export function withPermission(
	requiredPermissions: Permission[],
	handler: AuthenticatedHandler
) {
	return withAuth(async (req, context, user) => {
		// Check if user has any of the required permissions
		const hasRequiredPermission = requiredPermissions.some((permission) =>
			user.permissions.includes(permission)
		);

		if (!hasRequiredPermission) {
			return NextResponse.json(
				{ error: "Insufficient permissions" },
				{ status: 403 }
			);
		}

		return handler(req, context, user);
	});
}
