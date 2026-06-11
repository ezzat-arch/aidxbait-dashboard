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

	// Store management permissions
	ViewStore = "store:view",
	CreateStoreItems = "store:create",
	UpdateStoreItems = "store:update",
	DeleteStoreItems = "store:delete",

	// Exercise Programs permissions
	ViewExercisePrograms = "exercise-programs:view",
	CreateExercisePrograms = "exercise-programs:create",
	UpdateExercisePrograms = "exercise-programs:update",
	DeleteExercisePrograms = "exercise-programs:delete",
	ManageVideos = "exercise-programs:manage-videos",

	// Program Subscriptions permissions
	ViewSubscriptions = "subscriptions:view",
	CreateSubscriptions = "subscriptions:create",
	UpdateSubscriptions = "subscriptions:update",
	CancelSubscriptions = "subscriptions:cancel",

	// Order management permissions
	ViewOrders = "orders:view",
	ViewOrderDetails = "orders:view-details",
	UpdateOrderStatus = "orders:update-status",
	CancelOrder = "orders:cancel",
	ManageRefunds = "orders:manage-refunds",

	// Therapist management permissions
	ViewTherapists = "therapists:view",
	ApproveTherapists = "therapists:approve",
	DeclineTherapists = "therapists:decline",

	// Service area (locations) management permissions
	ViewLocations = "locations:view",
	CreateLocations = "locations:create",
	UpdateLocations = "locations:update",
	DeleteLocations = "locations:delete",
}

// Define role types
export enum Role {
	Superuser = "superuser",
	Admin = "admin",
	Therapist = "therapist",
	Consultant = "consultant",
	Patient = "patient",
	Guest = "guest",
}

// Define role-permission mapping
export interface RolePermissions {
	[Role.Superuser]: Permission[];
	[Role.Admin]: Permission[];
	[Role.Therapist]: Permission[];
	[Role.Consultant]: Permission[];
	[Role.Patient]: Permission[];
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
