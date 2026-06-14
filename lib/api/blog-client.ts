"use client";

import { getStoredToken } from "@/lib/auth";
import type { BlogPostDetail } from "@/lib/types";

/** Fetch a blog post with member token so private posts return full body. */
export async function getBlogPostWithAuth(slug: string): Promise<BlogPostDetail | null> {
	const token = getStoredToken();
	if (!token) return null;
	try {
		const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				Authorization: `Token ${token}`,
			},
			cache: "no-store",
		});
		if (!res.ok) return null;
		return (await res.json()) as BlogPostDetail;
	} catch {
		return null;
	}
}
