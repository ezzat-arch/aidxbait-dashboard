import { BlogsTable } from "@/components/blogs/blogs-table";

export default function BlogsPage() {
	return (
		<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Blog</h1>
					<p className="text-sm text-muted-foreground">
						Write and manage the blog posts shown on the public website in
						English and Arabic.
					</p>
				</div>
			</div>
			<BlogsTable />
		</div>
	);
}
