import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<Card className="w-full max-w-[400px] mx-4">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<FileQuestion className="h-12 w-12 text-muted-foreground" />
					</div>
					<CardTitle>404 - Page Not Found</CardTitle>
					<CardDescription>
						The page you're looking for doesn't exist.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground">
						The page may have been moved, deleted, or you may have typed the URL
						incorrectly.
					</p>
				</CardContent>
				<CardFooter className="flex flex-wrap justify-center gap-2">
					<Button asChild variant="default">
						<Link href="/">Go Home</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/dashboard/users">Dashboard</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
