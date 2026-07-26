"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	MoreHorizontal,
	Edit,
	Trash2,
	Search,
	Plus,
	ImageIcon,
	Package,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { DeleteBlogDialog } from "@/components/blogs/delete-blog-dialog";
import type { PostListRow, PostStatus } from "@/types/blog-types";

const STATUS_BADGES: Record<PostStatus, { label: string; className: string }> =
	{
		published: { label: "Published", className: "bg-green-500/20 text-green-600" },
		draft: { label: "Draft", className: "bg-zinc-500/10 text-muted-foreground" },
		archived: { label: "Archived", className: "bg-amber-500/20 text-amber-600" },
	};

export function BlogsTable() {
	const [posts, setPosts] = useState<PostListRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const itemsPerPage = 10;

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const [selected, setSelected] = useState<PostListRow | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const router = useRouter();
	const { toast } = useToast();

	const fetchPosts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
			});
			if (search) params.append("search", search);
			if (statusFilter !== "all") params.append("status", statusFilter);

			const res = await fetch(`/api/protected/blogs?${params.toString()}`);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || `Error: ${res.statusText}`);
			}
			const result = await res.json();
			if (result.data.length === 0 && page > 1) {
				setPage(Math.max(1, result.meta.totalPages));
				return;
			}
			setPosts(result.data);
			setTotalPages(result.meta.totalPages);
			setTotal(result.meta.total);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load posts";
			setError(message);
			toast({ variant: "destructive", title: "Error", description: message });
		} finally {
			setLoading(false);
		}
	}, [page, search, statusFilter, toast]);

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		setSearch(searchInput);
	};

	const openDelete = (post: PostListRow) => {
		setSelected(post);
		setDeleteOpen(true);
	};

	return (
		<>
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
				<form onSubmit={handleSearch} className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search posts by title..."
							className="pl-10"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</form>
				<Select
					value={statusFilter}
					onValueChange={(value) => {
						setPage(1);
						setStatusFilter(value);
					}}
				>
					<SelectTrigger className="w-full md:w-[180px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="published">Published</SelectItem>
						<SelectItem value="archived">Archived</SelectItem>
					</SelectContent>
				</Select>
				<PermissionGate permissions={[Permission.CreateBlogs]}>
					<Button onClick={() => router.push("/dashboard/blogs/new")}>
						<Plus className="mr-2 h-4 w-4" />
						Add Post
					</Button>
				</PermissionGate>
			</div>

			<div className="flex flex-col space-y-4 bg-card rounded-lg border border-border">
				<div className="rounded-md">
					<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[80px]">Image</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Author</TableHead>
								<TableHead>Products</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="w-[80px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`loading-${i}`}>
										{Array.from({ length: 7 }).map((__, j) => (
											<TableCell key={j}>
												<div className="h-4 w-24 bg-muted animate-pulse rounded" />
											</TableCell>
										))}
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-center py-8 text-destructive"
									>
										{error}
									</TableCell>
								</TableRow>
							) : posts.length > 0 ? (
								posts.map((post) => (
									<TableRow key={post.id}>
										<TableCell>
											{post.featured_image ? (
												<img
													src={post.featured_image}
													alt={post.title_en || "Post image"}
													className="h-10 w-16 rounded object-cover"
												/>
											) : (
												<div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
													<ImageIcon className="h-4 w-4 text-muted-foreground" />
												</div>
											)}
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-medium">
													{post.title_en || "—"}
												</span>
												<span
													className="text-sm text-muted-foreground"
													dir="rtl"
												>
													{post.title_ar || "—"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={STATUS_BADGES[post.status].className}
											>
												{STATUS_BADGES[post.status].label}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="text-sm">
												{post.author_name || "—"}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={
													post.product_count > 0
														? "bg-blue-500/10 text-blue-600"
														: "bg-zinc-500/10 text-muted-foreground"
												}
											>
												<Package className="mr-1 h-3 w-3" />
												{post.product_count}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground">
												{new Date(post.created_at).toLocaleString()}
											</span>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">Open menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />
													<PermissionGate
														permissions={[Permission.UpdateBlogs]}
													>
														<DropdownMenuItem
															onClick={() =>
																router.push(
																	`/dashboard/blogs/${post.id}/edit`
																)
															}
														>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
													</PermissionGate>
													<PermissionGate
														permissions={[Permission.DeleteBlogs]}
													>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => openDelete(post)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</PermissionGate>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-8">
										No posts found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
					</div>
				</div>

				{!loading && !error && posts.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-sm text-muted-foreground">
							Showing {Math.min(total, (page - 1) * itemsPerPage + 1)} to{" "}
							{Math.min(total, page * itemsPerPage)} of {total} posts
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page - 1)}
								disabled={page === 1}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page + 1)}
								disabled={page === totalPages}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>

			<DeleteBlogDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				post={selected}
				onSuccess={fetchPosts}
			/>
		</>
	);
}
