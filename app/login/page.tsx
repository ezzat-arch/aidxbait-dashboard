import { redirect } from "next/navigation";
import Image from "next/image";

import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
	const supabase = await createClient();

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		redirect("/dashboard/users");
	}

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1023] via-[#101a3a] to-[#1a237e]">
			{/* Animated background overlay */}
			<div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a1023cc] via-[#101a3acc] to-[#1a237ecc] blur-2xl" />

			{/* Logo and tagline */}
			<div className="z-10 flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
				<Image
					src="/logo-full-white.png"
					alt="AidXBait Logo"
					width={320}
					height={80}
					priority
					className="drop-shadow-xl mb-2"
				/>
			</div>

			{/* Glassmorphic card for login form */}
			<div className="z-10 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 px-8 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
				<LoginForm />
			</div>
		</div>
	);
}
