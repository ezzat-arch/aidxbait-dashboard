import {
	Permission,
	Role,
	type RolePermissions,
} from "@/types/permission-types";

// Define which permissions each role has
export const ROLE_PERMISSIONS: RolePermissions = {
	[Role.Superuser]: Object.values(Permission), // Superusers have all permissions
	[Role.Admin]: [
		// Store - Full CRUD access
		Permission.ViewStore,
		Permission.CreateStoreItems,
		Permission.UpdateStoreItems,
		Permission.DeleteStoreItems,
		// Exercise Programs - Full CRUD access
		Permission.ViewExercisePrograms,
		Permission.CreateExercisePrograms,
		Permission.UpdateExercisePrograms,
		Permission.DeleteExercisePrograms,
		Permission.ManageVideos,
	],
	[Role.Therapist]: [],
	[Role.Consultant]: [],
	[Role.Patient]: [],
	[Role.Guest]: [],
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
	"/dashboard/store": [Permission.ViewStore],
	"/dashboard/exercise-programs": [Permission.ViewExercisePrograms],
	"/dashboard/program-subscription": [Permission.ViewSubscriptions],
	"/dashboard/orders": [Permission.ViewOrders],
};

// Define API route permissions
export const API_PERMISSIONS: Record<string, Permission[]> = {
	"GET /api/protected/users": [Permission.ViewUsers],
	"POST /api/protected/users": [Permission.CreateUsers],
	"GET /api/protected/users/[id]": [Permission.ViewUsers],
	"PUT /api/protected/users/[id]": [Permission.UpdateUsers],
	"DELETE /api/protected/users/[id]": [Permission.DeleteUsers],
	"GET /api/protected/analytics": [Permission.ViewAnalytics],
	"GET /api/protected/settings": [Permission.ViewSettings],
	"PUT /api/protected/settings": [Permission.UpdateSettings],
	"GET /api/protected/audit-logs": [Permission.ViewAuditLogs],
	"GET /api/protected/store": [Permission.ViewStore],
	"POST /api/protected/store": [Permission.CreateStoreItems],
	"PUT /api/protected/store": [Permission.UpdateStoreItems],
	"DELETE /api/protected/store": [Permission.DeleteStoreItems],

	// Store categories
	"GET /api/protected/store/categories": [Permission.ViewStore],
	"POST /api/protected/store/categories": [Permission.CreateStoreItems],
	"GET /api/protected/store/categories/[id]": [Permission.ViewStore],
	"PUT /api/protected/store/categories/[id]": [Permission.UpdateStoreItems],
	"DELETE /api/protected/store/categories/[id]": [Permission.DeleteStoreItems],

	// Store subcategories (nested under category)
	"GET /api/protected/store/categories/[id]/subcategories": [
		Permission.ViewStore,
	],
	"POST /api/protected/store/categories/[id]/subcategories": [
		Permission.CreateStoreItems,
	],
	"GET /api/protected/store/categories/[id]/subcategories/[subId]": [
		Permission.ViewStore,
	],
	"PUT /api/protected/store/categories/[id]/subcategories/[subId]": [
		Permission.UpdateStoreItems,
	],
	"DELETE /api/protected/store/categories/[id]/subcategories/[subId]": [
		Permission.DeleteStoreItems,
	],

	// Exercise Programs API permissions
	"GET /api/protected/exercise-programs/videos": [
		Permission.ViewExercisePrograms,
	],
	"POST /api/protected/exercise-programs/videos": [Permission.ManageVideos],
	"PUT /api/protected/exercise-programs/videos": [Permission.ManageVideos],
	"DELETE /api/protected/exercise-programs/videos": [Permission.ManageVideos],
	"GET /api/protected/exercise-programs/programs": [
		Permission.ViewExercisePrograms,
	],
	"POST /api/protected/exercise-programs/programs": [
		Permission.CreateExercisePrograms,
	],
	"PUT /api/protected/exercise-programs/programs": [
		Permission.UpdateExercisePrograms,
	],
	"DELETE /api/protected/exercise-programs/programs": [
		Permission.DeleteExercisePrograms,
	],
	"GET /api/protected/exercise-programs/joints": [
		Permission.ViewExercisePrograms,
	],
	"POST /api/protected/exercise-programs/joints": [
		Permission.CreateExercisePrograms,
	],
	"PUT /api/protected/exercise-programs/joints": [
		Permission.UpdateExercisePrograms,
	],
	"DELETE /api/protected/exercise-programs/joints": [
		Permission.DeleteExercisePrograms,
	],

	// Program Exercises API permissions (new program_exercises table)
	"GET /api/protected/exercise-programs/programs/[id]/exercises": [
		Permission.ViewExercisePrograms,
	],
	"POST /api/protected/exercise-programs/programs/[id]/exercises": [
		Permission.UpdateExercisePrograms,
	],
	"PUT /api/protected/exercise-programs/programs/[id]/exercises/[exerciseId]": [
		Permission.UpdateExercisePrograms,
	],
	"DELETE /api/protected/exercise-programs/programs/[id]/exercises/[exerciseId]":
		[Permission.UpdateExercisePrograms],

	// Program Subscriptions API permissions
	"GET /api/protected/exercise-programs/subscriptions": [
		Permission.ViewSubscriptions,
	],
	"POST /api/protected/exercise-programs/subscriptions": [
		Permission.CreateSubscriptions,
	],
	"PUT /api/protected/exercise-programs/subscriptions": [
		Permission.UpdateSubscriptions,
	],
	"DELETE /api/protected/exercise-programs/subscriptions": [
		Permission.CancelSubscriptions,
	],

	// Order Management API permissions
	"GET /api/protected/orders": [Permission.ViewOrders],
	"GET /api/protected/orders/[id]": [Permission.ViewOrderDetails],
	"PUT /api/protected/orders/[id]": [Permission.UpdateOrderStatus],
	"PUT /api/protected/orders/[id]/cancel": [Permission.CancelOrder],
};
