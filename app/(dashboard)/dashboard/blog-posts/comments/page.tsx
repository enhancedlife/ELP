"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ExternalLink, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	deleteDashboardBlogComment,
	describeDashboardFetchFailure,
	getDashboardBlogComments,
	patchDashboardBlogComment,
} from "@/lib/api/dashboard";
import type {
	DashboardBlogComment,
	DashboardBlogCommentStatus,
} from "@/lib/types/dashboard";

function formatWhen(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

const STATUS_BADGE: Record<DashboardBlogCommentStatus, string> = {
	pending: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
	approved: "bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-200",
	rejected: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
};

export default function DashboardBlogCommentsPage() {
	const [comments, setComments] = useState<DashboardBlogComment[]>([]);
	const [pendingCount, setPendingCount] = useState(0);
	const [statusFilter, setStatusFilter] = useState<DashboardBlogCommentStatus | "all">(
		"pending",
	);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [actingId, setActingId] = useState<number | null>(null);

	const reload = useCallback(async () => {
		setLoading(true);
		const res = await getDashboardBlogComments({
			status: statusFilter === "all" ? undefined : statusFilter,
			limit: 200,
		});
		if (!res.ok || !res.data) {
			setBanner(describeDashboardFetchFailure(res.status, res.errorMessage));
			setComments([]);
			setPendingCount(0);
		} else {
			setBanner(null);
			setComments(Array.isArray(res.data.comments) ? res.data.comments : []);
			setPendingCount(
				typeof res.data.pending_count === "number" ? res.data.pending_count : 0,
			);
		}
		setLoading(false);
	}, [statusFilter]);

	useEffect(() => {
		void reload();
	}, [reload]);

	async function setStatus(id: number, status: DashboardBlogCommentStatus) {
		setActingId(id);
		const res = await patchDashboardBlogComment(id, { status });
		setActingId(null);
		if (!res.ok) {
			toast.error("Could not update comment", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success(status === "approved" ? "Comment approved" : "Comment rejected");
		await reload();
	}

	async function handleDelete(id: number) {
		if (!window.confirm("Permanently delete this comment?")) return;
		setActingId(id);
		const res = await deleteDashboardBlogComment(id);
		setActingId(null);
		if (!res.ok) {
			toast.error("Could not delete comment", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Comment deleted");
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Blog comments</h1>
					<p className="text-muted-foreground text-sm mt-1">
						Approve or reject comments before they appear to other readers. Authors always see their own comments.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/dashboard/blog-posts">← Blog posts</Link>
				</Button>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
					<div>
						<CardTitle>Moderation queue</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							{pendingCount} pending
							{loading ? " …" : ""}
						</p>
					</div>
					<Select
						value={statusFilter}
						onValueChange={(v) =>
							setStatusFilter(v as DashboardBlogCommentStatus | "all")
						}
					>
						<SelectTrigger className="w-[160px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="approved">Approved</SelectItem>
							<SelectItem value="rejected">Rejected</SelectItem>
							<SelectItem value="all">All</SelectItem>
						</SelectContent>
					</Select>
				</CardHeader>
				<CardContent>
					{comments.length === 0 && !loading ? (
						<p className="text-sm text-muted-foreground">No comments in this filter.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Post</TableHead>
									<TableHead>Author</TableHead>
									<TableHead>Comment</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{comments.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="align-top max-w-[160px]">
											<p className="font-medium truncate">{c.post_title}</p>
											<Link
												href={`/blog/${c.post_slug}`}
												target="_blank"
												className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
											>
												View post
												<ExternalLink className="h-3 w-3" />
											</Link>
										</TableCell>
										<TableCell className="align-top">
											<p className="font-medium">{c.author_name}</p>
											<p className="text-xs text-muted-foreground truncate max-w-[140px]">
												{c.author_email}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{formatWhen(c.created_at)}
											</p>
										</TableCell>
										<TableCell className="align-top max-w-md">
											<p className="text-sm whitespace-pre-wrap break-words line-clamp-4">
												{c.body}
											</p>
										</TableCell>
										<TableCell className="align-top">
											<Badge className={STATUS_BADGE[c.status]} variant="secondary">
												{c.status}
											</Badge>
										</TableCell>
										<TableCell className="align-top text-right">
											<div className="flex flex-col items-end gap-1">
												{c.status !== "approved" ? (
													<Button
														type="button"
														size="sm"
														variant="outline"
														disabled={actingId === c.id}
														onClick={() => void setStatus(c.id, "approved")}
													>
														<Check className="h-3.5 w-3.5 mr-1" />
														Approve
													</Button>
												) : null}
												{c.status !== "rejected" ? (
													<Button
														type="button"
														size="sm"
														variant="ghost"
														className="text-destructive hover:text-destructive"
														disabled={actingId === c.id}
														onClick={() => void setStatus(c.id, "rejected")}
													>
														<X className="h-3.5 w-3.5 mr-1" />
														Reject
													</Button>
												) : null}
												<Button
													type="button"
													size="sm"
													variant="ghost"
													className="text-muted-foreground"
													disabled={actingId === c.id}
													onClick={() => void handleDelete(c.id)}
												>
													<Trash2 className="h-3.5 w-3.5 mr-1" />
													Delete
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
