import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
	const cookieStore = cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		redirect("/dashboard/users");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background">
			<div className="w-full max-w-md space-y-8 px-4 py-8">
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-primary">
						AidXBait
					</h1>
					<p className="text-muted-foreground">Internal Management Dashboard</p>
				</div>
				<LoginForm />
			</div>
		</div>
	);
}
