import {
	Permission,
	Role,
	type RolePermissions,
} from "@/types/permission-types";

// Define which permissions each role has
export const ROLE_PERMISSIONS: RolePermissions = {
	[Role.SuperAdmin]: Object.values(Permission), // Super admins have all permissions
	[Role.Admin]: [
		Permission.ViewUsers,
		Permission.CreateUsers,
		Permission.UpdateUsers,
		Permission.DeleteUsers,
		Permission.ViewAnalytics,
		Permission.ExportAnalytics,
		Permission.ViewSettings,
		Permission.UpdateSettings,
		Permission.ViewAuditLogs,
	],
	[Role.Manager]: [
		Permission.ViewUsers,
		Permission.CreateUsers,
		Permission.UpdateUsers,
		Permission.ViewAnalytics,
		Permission.ExportAnalytics,
		Permission.ViewSettings,
	],
	[Role.User]: [
		Permission.ViewUsers,
		Permission.ViewAnalytics,
		Permission.ViewSettings,
	],
	[Role.Guest]: [Permission.ViewUsers],
};

// Define route access based on permissions
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
	"/dashboard/users": [Permission.ViewUsers],
	"/dashboard/users/create": [Permission.CreateUsers],
	"/dashboard/users/edit": [Permission.UpdateUsers],
	"/dashboard/analytics": [Permission.ViewAnalytics],
	"/dashboard/settings": [Permission.ViewSettings],
	"/dashboard/admin": [Permission.ManageRoles],
	"/dashboard/audit-logs": [Permission.ViewAuditLogs],
};

// Define API route permissions
export const API_PERMISSIONS: Record<string, Permission[]> = {
	"GET /api/protected/users": [Permission.ViewUsers],
	"POST /api/protected/users": [Permission.CreateUsers],
	"PUT /api/protected/users": [Permission.UpdateUsers],
	"DELETE /api/protected/users": [Permission.DeleteUsers],
	"GET /api/protected/analytics": [Permission.ViewAnalytics],
	"GET /api/protected/settings": [Permission.ViewSettings],
	"PUT /api/protected/settings": [Permission.UpdateSettings],
	"GET /api/protected/audit-logs": [Permission.ViewAuditLogs],
};
