import { UsersTable } from "@/components/users/users-table";
import { UsersHeader } from "@/components/users/users-header";

export default function UsersPage() {
	return (
		<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
			<UsersHeader />
			<UsersTable />
		</div>
	);
}
