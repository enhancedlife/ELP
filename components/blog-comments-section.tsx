"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	formatCommentDate,
	getBlogPostComments,
	postBlogComment,
} from "@/lib/api/blog-comments";
import {
	AUTH_SESSION_CHANGE_EVENT,
	fetchAuthUser,
	type AuthUser,
} from "@/lib/auth";
import type { BlogCommentPublic } from "@/lib/types";

type BlogCommentsSectionProps = {
	slug: string;
};

export function BlogCommentsSection({ slug }: BlogCommentsSectionProps) {
	const pathname = usePathname();
	const [comments, setComments] = useState<BlogCommentPublic[]>([]);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [body, setBody] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const reload = useCallback(async () => {
		setLoading(true);
		const [list, session] = await Promise.all([
			getBlogPostComments(slug),
			fetchAuthUser(),
		]);
		setComments(list);
		setUser(session);
		setLoading(false);
	}, [slug]);

	useEffect(() => {
		void reload();
	}, [reload]);

	useEffect(() => {
		const onAuthChange = () => {
			void reload();
		};
		window.addEventListener(AUTH_SESSION_CHANGE_EVENT, onAuthChange);
		return () => window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, onAuthChange);
	}, [reload]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const text = body.trim();
		if (!text) return;
		if (!user) {
			toast.error("Sign in to post a comment.");
			return;
		}
		setSubmitting(true);
		const result = await postBlogComment(slug, text);
		setSubmitting(false);
		if (!result.ok) {
			toast.error(result.detail);
			return;
		}
		setBody("");
		setComments((prev) => {
			const exists = prev.some((c) => c.id === result.comment.id);
			if (exists) return prev;
			return [result.comment, ...prev];
		});
		toast.success("Comment posted");
	}

	const loginHref = `/auth/login?next=${encodeURIComponent(pathname || `/blog/${slug}`)}`;

	return (
		<section className="mt-14 border-t border-white/10 pt-10">
			<div className="flex items-center gap-2 mb-6">
				<MessageSquare className="h-5 w-5 text-green-400" />
				<h2 className="text-xl font-heading font-bold uppercase tracking-wide">
					Comments
				</h2>
				{!loading ? (
					<span className="text-sm text-gray-400">({comments.length})</span>
				) : null}
			</div>

			{user ? (
				<form onSubmit={(e) => void handleSubmit(e)} className="mb-8 space-y-3">
					<Textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						placeholder="Share your thoughts…"
						maxLength={2000}
						rows={4}
						className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-y min-h-[100px]"
						disabled={submitting}
					/>
					<div className="flex items-center justify-between gap-3">
						<p className="text-xs text-gray-500">
							Posting as {user.name || user.email}
						</p>
						<Button
							type="submit"
							disabled={submitting || !body.trim()}
							className="bg-green-600 hover:bg-green-700"
						>
							<Send className="h-4 w-4 mr-2" />
							{submitting ? "Posting…" : "Post comment"}
						</Button>
					</div>
				</form>
			) : (
				<div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-5">
					<p className="text-gray-300 text-sm mb-3">
						Sign in to join the discussion.
					</p>
					<Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
						<Link href={loginHref}>Sign in to comment</Link>
					</Button>
				</div>
			)}

			{loading ? (
				<p className="text-sm text-gray-400">Loading comments…</p>
			) : comments.length === 0 ? (
				<p className="text-sm text-gray-400">No comments yet. Be the first to share your thoughts.</p>
			) : (
				<ul className="space-y-4">
					{comments.map((comment) => (
						<li
							key={comment.id}
							className="rounded-lg border border-white/10 bg-white/5 p-4"
						>
							<div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
								<p className="font-medium text-white">{comment.author_name}</p>
								<time className="text-xs text-gray-500">
									{formatCommentDate(comment.created_at)}
								</time>
							</div>
							<p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
								{comment.body}
							</p>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
