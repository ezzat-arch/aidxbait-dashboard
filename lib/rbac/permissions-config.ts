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
		// Therapists - view + approval workflow
		Permission.ViewTherapists,
		Permission.ApproveTherapists,
		Permission.DeclineTherapists,
		// Service areas - full CRUD
		Permission.ViewLocations,
		Permission.CreateLocations,
		Permission.UpdateLocations,
		Permission.DeleteLocations,
		// Specialties - full CRUD
		Permission.ViewSpecialties,
		Permission.CreateSpecialties,
		Permission.UpdateSpecialties,
		Permission.DeleteSpecialties,
		// Blog - full CRUD
		Permission.ViewBlogs,
		Permission.CreateBlogs,
		Permission.UpdateBlogs,
		Permission.DeleteBlogs,
		// Orders - view only (status changes / cancel / refunds stay superuser-only)
		Permission.ViewOrders,
		Permission.ViewOrderDetails,
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
	"/dashboard/shopify-orders": [Permission.ViewOrders],
	"/dashboard/therapists": [Permission.ViewTherapists],
	"/dashboard/locations": [Permission.ViewLocations],
	"/dashboard/specialties": [Permission.ViewSpecialties],
	"/dashboard/blogs": [Permission.ViewBlogs],
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

	// Shopify orders (read-only, Admin API) — reuses the orders permissions
	"GET /api/protected/shopify-orders": [Permission.ViewOrders],
	"GET /api/protected/shopify-orders/[id]": [Permission.ViewOrderDetails],

	// Therapist management API permissions
	"GET /api/protected/therapists": [Permission.ViewTherapists],
	"GET /api/protected/therapists/[id]": [Permission.ViewTherapists],
	"PUT /api/protected/therapists/[id]/approve": [Permission.ApproveTherapists],
	"PUT /api/protected/therapists/[id]/decline": [Permission.DeclineTherapists],

	// Service area (locations) API permissions
	"GET /api/protected/locations": [Permission.ViewLocations],
	"POST /api/protected/locations": [Permission.CreateLocations],
	"PUT /api/protected/locations/[id]": [Permission.UpdateLocations],
	"DELETE /api/protected/locations/[id]": [Permission.DeleteLocations],

	// Specialty API permissions
	"GET /api/protected/specialties": [Permission.ViewSpecialties],
	"POST /api/protected/specialties": [Permission.CreateSpecialties],
	"PUT /api/protected/specialties/[id]": [Permission.UpdateSpecialties],
	"DELETE /api/protected/specialties/[id]": [Permission.DeleteSpecialties],

	// Blog API permissions
	"GET /api/protected/blogs": [Permission.ViewBlogs],
	"POST /api/protected/blogs": [Permission.CreateBlogs],
	"PUT /api/protected/blogs": [Permission.UpdateBlogs],
	"DELETE /api/protected/blogs": [Permission.DeleteBlogs],
	"GET /api/protected/blogs/[id]": [Permission.ViewBlogs],
	"PUT /api/protected/blogs/[id]": [Permission.UpdateBlogs],
	"DELETE /api/protected/blogs/[id]": [Permission.DeleteBlogs],
	"POST /api/protected/blogs/upload-images": [
		Permission.CreateBlogs,
		Permission.UpdateBlogs,
	],
	"GET /api/protected/blogs/shopify-products": [
		Permission.CreateBlogs,
		Permission.UpdateBlogs,
	],
};
