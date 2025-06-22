"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { setupTokenRefresh } from "@/lib/auth/token-refresh";
import { type Permission, Role, type RbacUser } from "@/types/permission-types";
import { getPermissionsForRoles, hasPermission } from "@/lib/rbac/permissions";
import type { UserData } from "@/types/user-types";

type UserContextType = {
	user: User | null;
	session: Session | null;
	rbacUser: RbacUser | null;
	appUser: UserData | null;
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
	appUser: null,
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
	const [appUser, setAppUser] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const supabase = createClient();

	// Fetch user data and permissions
	const fetchUserData = async (supabaseId: string) => {
		try {
			const { data: userRecord, error } = await supabase
				.from("users")
				.select("*")
				.eq("supabase_id", supabaseId)
				.single();

			if (error || !userRecord) throw error;

			const { data: adminData } = await supabase
				.from("admins")
				.select("id")
				.eq("user_id", userRecord.id)
				.single();

			const { data: superData } = await supabase
				.from("superusers")
				.select("id")
				.eq("user_id", userRecord.id)
				.single();

			const roles: Role[] = [userRecord.user_type as Role];
			const permissions = getPermissionsForRoles(roles);

			setAppUser({
				...userRecord,
				admin_id: adminData?.id ?? null,
				superuser_id: superData?.id ?? null,
			});

			setRbacUser({
				id: String(userRecord.id),
				email: userRecord.email || "",
				roles,
				permissions,
			});
		} catch (err) {
			console.error("Error fetching user data:", err);
			setAppUser(null);
			setRbacUser({
				id: supabaseId,
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
					await fetchUserData(session.user.id);
				} else {
					setRbacUser(null);
					setAppUser(null);
				}

				setIsLoading(false);
			}
		);

		// Set up token refresh
		const cleanupTokenRefresh = setupTokenRefresh();

		// Initial loading state update and role fetch
		if (user) {
			fetchUserData(user.id).finally(() => {
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
				data: { user: refreshedUser },
				error: authError,
			} = await supabase.auth.getUser();

			if (!authError && refreshedUser) {
				setUser(refreshedUser);
				// We don't get the session from getUser, but we can keep the existing one
				// or get it separately if needed
				await fetchUserData(refreshedUser.id);
			} else {
				setUser(null);
				setSession(null);
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
		setAppUser(null);
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
				appUser,
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
