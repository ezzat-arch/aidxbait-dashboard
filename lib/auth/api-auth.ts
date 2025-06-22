import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Permission, Role } from "@/types/permission-types";
import { getPermissionsForRoles } from "@/lib/rbac/permissions";

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
		const supabase = await createClient();

		const {
			data: { user: authUser },
			error: authError,
		} = await supabase.auth.getUser();

		if (!authUser || authError) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user record
		const { data: userRecord, error } = await supabase
			.from("users")
			.select("*")
			.eq("supabase_id", authUser.id)
			.single();

		if (error || !userRecord) {
			return NextResponse.json(
				{ error: "Unauthorized access" },
				{ status: 403 }
			);
		}

		if (
			userRecord.user_type !== "admin" &&
			userRecord.user_type !== "superuser"
		) {
			return NextResponse.json(
				{ error: "Unauthorized access" },
				{ status: 403 }
			);
		}

		const roles: Role[] = [userRecord.user_type as Role];
		const permissions = getPermissionsForRoles(roles);

		const user = {
			id: String(userRecord.id),
			email: userRecord.email || "",
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
