import type React from "react";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionManager } from "@/components/auth/session-manager";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/providers/user-provider";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "AidXBait - Internal Management",
	description: "Internal management dashboard for AidXBait",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();

	// For the root layout, we need to get the session to pass to UserProvider
	// but we'll validate the user first for security
	const { data: userData } = await supabase.auth.getUser();
	const { data } = await supabase.auth.getSession();
	const session = userData.user ? data.session : null;

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.className} bg-background text-foreground antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
				>
					<UserProvider initialSession={session}>
						{children}
						<SessionManager />
						<Toaster />
					</UserProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
