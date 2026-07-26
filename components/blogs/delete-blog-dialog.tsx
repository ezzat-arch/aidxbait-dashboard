"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import type { PostListRow } from "@/types/blog-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	post: PostListRow | null;
	onSuccess: () => void;
}

export function DeleteBlogDialog({
	open,
	onOpenChange,
	post,
	onSuccess,
}: Props) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleDelete = async () => {
		if (!post) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/protected/blogs/${post.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || "Failed to delete post");
			}
			toast({
				title: "Deleted",
				description: `"${post.title_en || `Post #${post.id}`}" was removed.`,
			});
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to delete post",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Delete {post?.title_en || `post #${post?.id}`}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This cannot be undone. The post and all of its translations and
						content blocks will be permanently removed. If you might publish it
						again later, set the status to archived instead.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleDelete();
						}}
						disabled={loading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
