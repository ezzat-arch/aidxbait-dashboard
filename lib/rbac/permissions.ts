import type { Permission, Role, RbacUser } from "@/types/permission-types";
import {
	ROLE_PERMISSIONS,
	ROUTE_PERMISSIONS,
	API_PERMISSIONS,
} from "./permissions-config";

/**
 * Get all permissions for a given set of roles
 */
export function getPermissionsForRoles(roles: Role[]): Permission[] {
	const permissions = new Set<Permission>();

	roles.forEach((role) => {
		if (role in ROLE_PERMISSIONS) {
			ROLE_PERMISSIONS[role].forEach((permission) =>
				permissions.add(permission)
			);
		}
	});

	return Array.from(permissions);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
	user: RbacUser | null,
	permission: Permission
): boolean {
	if (!user) return false;

	// If user has pre-calculated permissions, use those
	if (user.permissions) {
		return user.permissions.includes(permission);
	}

	// Otherwise calculate permissions from roles
	const permissions = getPermissionsForRoles(user.roles);
	return permissions.includes(permission);
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
	user: RbacUser | null,
	permissions: Permission[]
): boolean {
	if (!user) return false;
	return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
	user: RbacUser | null,
	permissions: Permission[]
): boolean {
	if (!user) return false;
	return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(user: RbacUser | null, route: string): boolean {
	if (!user) return false;

	// Find the most specific matching route
	const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
		.filter((pattern) => route.startsWith(pattern))
		.sort((a, b) => b.length - a.length); // Sort by specificity (longest first)

	if (matchingRoutes.length === 0) return true; // No permissions defined for route

	const requiredPermissions = ROUTE_PERMISSIONS[matchingRoutes[0]];
	return hasAnyPermission(user, requiredPermissions);
}

/**
 * Check if a user can access a specific API endpoint
 */
export function canAccessApi(
	user: RbacUser | null,
	method: string,
	path: string
): boolean {
	if (!user) return false;

	const key = `${method} ${path}`;

	// Find the most specific matching API route
	const matchingRoutes = Object.keys(API_PERMISSIONS)
		.filter((pattern) => {
			const [patternMethod, patternPath] = pattern.split(" ");
			return patternMethod === method && path.startsWith(patternPath);
		})
		.sort((a, b) => {
			const pathA = a.split(" ")[1];
			const pathB = b.split(" ")[1];
			return pathB.length - pathA.length; // Sort by specificity (longest path first)
		});

	if (matchingRoutes.length === 0) return true; // No permissions defined for API

	const requiredPermissions = API_PERMISSIONS[matchingRoutes[0]];
	return hasAnyPermission(user, requiredPermissions);
}
