"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { setupTokenRefresh } from "@/lib/auth/token-refresh";
import { type Permission, Role, type RbacUser } from "@/types/permission-types";
import { getPermissionsForRoles, hasPermission } from "@/lib/rbac/permissions";

type UserContextType = {
	user: User | null;
	session: Session | null;
	rbacUser: RbacUser | null;
	refreshUser: () => Promise<void>;
	clearUser: () => void;
	isLoading: boolean;
	hasPermission: (permission: Permission) => boolean;
	hasRole: (role: Role) => boolean;
};

const UserContext = createContext<UserContextType>({
	user: null,
	session: null,
	rbacUser: null,
	refreshUser: async () => {},
	clearUser: () => {},
	isLoading: true,
	hasPermission: () => false,
	hasRole: () => false,
});

export function UserProvider({
	children,
	initialSession,
}: {
	children: React.ReactNode;
	initialSession: Session | null;
}) {
	const [user, setUser] = useState<User | null>(initialSession?.user || null);
	const [session, setSession] = useState<Session | null>(initialSession);
	const [rbacUser, setRbacUser] = useState<RbacUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const supabase = createClient();

	// Fetch user roles and permissions
	const fetchUserRolesAndPermissions = async (userId: string) => {
		try {
			// Fetch user roles from the database
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
				.eq("user_id", userId);

			if (rolesError) throw rolesError;

			// Extract role names
			const roles =
				userRoles?.map(
					(ur: { role_id: string; roles: { id: string; name: string } }) =>
						ur.roles.name as Role
				) || [];

			// If no roles assigned, default to guest
			if (roles.length === 0) {
				roles.push(Role.Guest);
			}

			// Calculate permissions based on roles
			const permissions = getPermissionsForRoles(roles);

			// Create RBAC user object
			const rbacUserData: RbacUser = {
				id: userId,
				email: user?.email || "",
				roles,
				permissions,
			};

			setRbacUser(rbacUserData);
		} catch (error) {
			console.error("Error fetching user roles:", error);
			// Set default guest role if there's an error
			setRbacUser({
				id: userId,
				email: user?.email || "",
				roles: [Role.Guest],
				permissions: getPermissionsForRoles([Role.Guest]),
			});
		}
	};

	useEffect(() => {
		// Set up auth state change listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(
			async (_event: AuthChangeEvent, session: Session | null) => {
				setUser(session?.user || null);
				setSession(session);

				if (session?.user) {
					await fetchUserRolesAndPermissions(session.user.id);
				} else {
					setRbacUser(null);
				}

				setIsLoading(false);
			}
		);

		// Set up token refresh
		const cleanupTokenRefresh = setupTokenRefresh();

		// Initial loading state update and role fetch
		if (user) {
			fetchUserRolesAndPermissions(user.id).finally(() => {
				setIsLoading(false);
			});
		} else {
			setIsLoading(false);
		}

		return () => {
			subscription.unsubscribe();
			cleanupTokenRefresh();
		};
	}, [supabase, user?.id]);

	const refreshUser = async () => {
		setIsLoading(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setUser(session?.user || null);
			setSession(session);

			if (session?.user) {
				await fetchUserRolesAndPermissions(session.user.id);
			}
		} catch (error) {
			console.error("Error refreshing user:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const clearUser = () => {
		setUser(null);
		setSession(null);
		setRbacUser(null);
	};

	// Helper function to check if user has a specific permission
	const checkPermission = (permission: Permission): boolean => {
		return hasPermission(rbacUser, permission);
	};

	// Helper function to check if user has a specific role
	const checkRole = (role: Role): boolean => {
		return rbacUser?.roles.includes(role) || false;
	};

	return (
		<UserContext.Provider
			value={{
				user,
				session,
				rbacUser,
				refreshUser,
				clearUser,
				isLoading,
				hasPermission: checkPermission,
				hasRole: checkRole,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export const useUserContext = () => useContext(UserContext);
