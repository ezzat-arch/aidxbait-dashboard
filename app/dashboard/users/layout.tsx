import type React from "react";
import { UsersFilterProvider } from "@/hooks/use-users-filter";

export default function UsersLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <UsersFilterProvider>{children}</UsersFilterProvider>;
}
