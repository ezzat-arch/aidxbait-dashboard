import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
	return (
		<div className="flex items-center justify-center h-full">
			<Card className="w-full max-w-[400px] mx-4">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<ShieldAlert className="h-12 w-12 text-destructive" />
					</div>
					<CardTitle>Access Denied</CardTitle>
					<CardDescription>
						You don't have permission to access this page.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p>
						If you believe this is an error, please contact your administrator
						for assistance.
					</p>
				</CardContent>
				<CardFooter className="flex justify-center">
					<Button asChild>
						<Link href="/dashboard">Return to Dashboard</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
