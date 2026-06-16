import type { BlogArchiveResponse, BlogPostDetail, BlogPostSummary } from "@/lib/blog"
import { backendUrl } from "@/lib/backend-public"

/** Next.js rewrites do not apply to RSC fetch — call Django directly on the server. */
function resolveBlogApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (typeof window === "undefined") {
    return backendUrl(normalized)
  }
  return normalized
}

async function safeFetchJson<T>(input: string): Promise<T | null> {
  try {
    const res = await fetch(resolveBlogApiUrl(input), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getFeaturedBlogPosts(): Promise<BlogPostSummary[]> {
  const data = await safeFetchJson<BlogPostSummary[]>("/api/blog/posts?featured=1")
  return Array.isArray(data) ? data : []
}

export async function getBlogArchivePage(
  page: number,
  pageSize = 6,
): Promise<BlogArchiveResponse> {
  const data = await safeFetchJson<BlogArchiveResponse>(
    `/api/blog/posts?archived=1&page=${page}&page_size=${pageSize}`,
  )
  if (data && Array.isArray(data.results)) return data
  return { count: 0, page: 1, page_size: pageSize, total_pages: 1, results: [] }
}

export async function getBlogPost(slug: string): Promise<BlogPostDetail | null> {
  return safeFetchJson<BlogPostDetail>(`/api/blog/posts/${encodeURIComponent(slug)}`)
}
