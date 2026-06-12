import { getStoredToken } from "@/lib/auth";
import type { BlogCommentPublic, BlogCommentsResponse } from "@/lib/types";

function commentHeaders(includeJson = false): HeadersInit {
	const headers: Record<string, string> = {
		Accept: "application/json",
	};
	if (includeJson) {
		headers["Content-Type"] = "application/json";
	}
	const token = getStoredToken();
	if (token) {
		headers.Authorization = `Token ${token}`;
	}
	return headers;
}

export async function getBlogPostComments(
	slug: string,
): Promise<BlogCommentPublic[]> {
	try {
		const res = await fetch(
			`/api/blog/posts/${encodeURIComponent(slug)}/comments`,
			{
				method: "GET",
				headers: commentHeaders(),
				cache: "no-store",
			},
		);
		if (!res.ok) return [];
		const data = (await res.json()) as BlogCommentsResponse;
		return Array.isArray(data.comments) ? data.comments : [];
	} catch {
		return [];
	}
}

export async function postBlogComment(
	slug: string,
	body: string,
): Promise<{ ok: true; comment: BlogCommentPublic } | { ok: false; detail: string }> {
	try {
		const res = await fetch(
			`/api/blog/posts/${encodeURIComponent(slug)}/comments`,
			{
				method: "POST",
				headers: commentHeaders(true),
				body: JSON.stringify({ body }),
				cache: "no-store",
			},
		);
		const data = (await res.json().catch(() => ({}))) as {
			detail?: string;
		} & Partial<BlogCommentPublic>;
		if (!res.ok) {
			return {
				ok: false,
				detail:
					typeof data.detail === "string"
						? data.detail
						: res.status === 401
							? "Sign in to post a comment."
							: "Could not post comment.",
			};
		}
		return {
			ok: true,
			comment: data as BlogCommentPublic,
		};
	} catch {
		return { ok: false, detail: "Could not reach the server." };
	}
}

export function formatCommentDate(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}
