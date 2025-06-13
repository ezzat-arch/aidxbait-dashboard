import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
	const cookieStore = cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/login");
	} else {
		redirect("/dashboard/users");
	}

	return null;
}
