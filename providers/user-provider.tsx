"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { type Permission, Role, type RbacUser } from "@/types/permission-types";
import { getPermissionsForRoles, hasPermission } from "@/lib/rbac/permissions";
import type { UserData } from "@/types/user-types";

type UserContextType = {
	user: User | null;
	rbacUser: RbacUser | null;
	appUser: UserData | null;
	refreshUser: () => Promise<void>;
	isLoading: boolean;
	hasPermission: (permission: Permission) => boolean;
	hasRole: (role: Role) => boolean;
};

const UserContext = createContext<UserContextType>({
	user: null,
	rbacUser: null,
	appUser: null,
	refreshUser: async () => {},
	isLoading: true,
	hasPermission: () => false,
	hasRole: () => false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
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

	// Initial user fetch
	useEffect(() => {
		const getInitialUser = async () => {
			try {
				const {
					data: { user: currentUser },
					error,
				} = await supabase.auth.getUser();

				if (!error && currentUser) {
					setUser(currentUser);
					await fetchUserData(currentUser.id);
				} else {
					setUser(null);
					setRbacUser(null);
					setAppUser(null);
				}
			} catch (error) {
				console.error("Error getting initial user:", error);
				setUser(null);
				setRbacUser(null);
				setAppUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		getInitialUser();
	}, []);

	const refreshUser = async () => {
		setIsLoading(true);
		try {
			const {
				data: { user: refreshedUser },
				error: authError,
			} = await supabase.auth.getUser();

			if (!authError && refreshedUser) {
				setUser(refreshedUser);
				await fetchUserData(refreshedUser.id);
			} else {
				setUser(null);
				setRbacUser(null);
				setAppUser(null);
			}
		} catch (error) {
			console.error("Error refreshing user:", error);
		} finally {
			setIsLoading(false);
		}
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
				rbacUser,
				appUser,
				refreshUser,
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
