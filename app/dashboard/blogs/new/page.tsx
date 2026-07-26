import { BlogForm } from "@/components/blogs/blog-form";

export default function NewBlogPage() {
	return (
		<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">New Post</h1>
					<p className="text-sm text-muted-foreground">
						The English translation is required; add Arabic to publish the post
						in both languages.
					</p>
				</div>
			</div>
			<BlogForm />
		</div>
	);
}
