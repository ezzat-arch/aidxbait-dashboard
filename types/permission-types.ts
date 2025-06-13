// Define all possible permissions in the system
export enum Permission {
	// User management permissions
	ViewUsers = "users:view",
	CreateUsers = "users:create",
	UpdateUsers = "users:update",
	DeleteUsers = "users:delete",

	// Analytics permissions
	ViewAnalytics = "analytics:view",
	ExportAnalytics = "analytics:export",

	// Settings permissions
	ViewSettings = "settings:view",
	UpdateSettings = "settings:update",

	// Admin permissions
	ManageRoles = "admin:manage-roles",
	ViewAuditLogs = "admin:view-audit-logs",
}

// Define role types
export enum Role {
	SuperAdmin = "super_admin",
	Admin = "admin",
	Manager = "manager",
	User = "user",
	Guest = "guest",
}

// Define role-permission mapping
export interface RolePermissions {
	[Role.SuperAdmin]: Permission[];
	[Role.Admin]: Permission[];
	[Role.Manager]: Permission[];
	[Role.User]: Permission[];
	[Role.Guest]: Permission[];
}

// Define user role type
export interface UserRole {
	id: string;
	name: string;
	permissions: Permission[];
}

// Define extended user type with roles
export interface RbacUser {
	id: string;
	email: string;
	roles: Role[];
	permissions?: Permission[];
}
