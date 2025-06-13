"use client";

import type React from "react";

import { useState, createContext, useContext } from "react";

type UsersFilterContextType = {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	statusFilter: string;
	setStatusFilter: (status: string) => void;
	selectedRoles: string[];
	toggleRole: (role: string) => void;
};

const UsersFilterContext = createContext<UsersFilterContextType | undefined>(
	undefined
);

export function UsersFilterProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

	const toggleRole = (role: string) => {
		setSelectedRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
		);
	};

	return (
		<UsersFilterContext.Provider
			value={{
				searchQuery,
				setSearchQuery,
				statusFilter,
				setStatusFilter,
				selectedRoles,
				toggleRole,
			}}
		>
			{children}
		</UsersFilterContext.Provider>
	);
}

export function useUsersFilter() {
	const context = useContext(UsersFilterContext);

	if (context === undefined) {
		return {
			searchQuery: "",
			setSearchQuery: () => {},
			statusFilter: "all",
			setStatusFilter: () => {},
			selectedRoles: [],
			toggleRole: () => {},
		};
	}

	return context;
}
