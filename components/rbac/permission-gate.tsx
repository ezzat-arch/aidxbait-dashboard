"use client";

import type React from "react";
import { useUserContext } from "@/providers/user-provider";
import type { Permission, Role } from "@/types/permission-types";

interface PermissionGateProps {
	children: React.ReactNode;
	permissions?: Permission[];
	roles?: Role[];
	requireAll?: boolean;
	fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions or roles
 */
export function PermissionGate({
	children,
	permissions = [],
	roles = [],
	requireAll = false,
	fallback = null,
}: PermissionGateProps) {
	const { rbacUser, hasPermission, hasRole } = useUserContext();

	// If no permissions or roles specified, always render children
	if (permissions.length === 0 && roles.length === 0) {
		return <>{children}</>;
	}

	// Check permissions
	let hasRequiredPermissions = true;
	if (permissions.length > 0) {
		if (requireAll) {
			hasRequiredPermissions = permissions.every((permission) =>
				hasPermission(permission)
			);
		} else {
			hasRequiredPermissions = permissions.some((permission) =>
				hasPermission(permission)
			);
		}
	}

	// Check roles
	let hasRequiredRoles = true;
	if (roles.length > 0) {
		if (requireAll) {
			hasRequiredRoles = roles.every((role) => hasRole(role));
		} else {
			hasRequiredRoles = roles.some((role) => hasRole(role));
		}
	}

	// Determine if access is granted
	const hasAccess =
		(permissions.length === 0 || hasRequiredPermissions) &&
		(roles.length === 0 || hasRequiredRoles);

	return hasAccess ? <>{children}</> : <>{fallback}</>;
}
