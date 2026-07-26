"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { BlogForm } from "@/components/blogs/blog-form";
import { useToast } from "@/components/ui/use-toast";
import type { PostDetail } from "@/types/blog-types";

export default function EditBlogPage() {
	const params = useParams<{ id: string }>();
	const [post, setPost] = useState<PostDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		const fetchPost = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/protected/blogs/${params.id}`);
				if (!res.ok) {
					const e = await res.json().catch(() => ({}));
					throw new Error(e.error || `Error: ${res.statusText}`);
				}
				const result = await res.json();
				setPost(result.data);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to load post";
				setError(message);
				toast({ variant: "destructive", title: "Error", description: message });
			} finally {
				setLoading(false);
			}
		};
		fetchPost();
	}, [params.id, toast]);

	return (
		<div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Edit Post</h1>
					<p className="text-sm text-muted-foreground">
						Update the post content, translations and related products.
					</p>
				</div>
			</div>
			{loading ? (
				<div className="bg-card rounded-lg border border-border p-4 sm:p-6 space-y-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
					))}
				</div>
			) : error ? (
				<div className="bg-card rounded-lg border border-border p-8 text-center text-destructive">
					{error}
				</div>
			) : post ? (
				<BlogForm post={post} />
			) : null}
		</div>
	);
}
