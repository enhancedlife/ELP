"use client"

import { useEffect, useState } from "react"
import { BlogContentGate } from "@/components/blog-content-gate"
import { BlogArticleBody } from "@/components/blog-article-body"
import { getBlogPostWithAuth } from "@/lib/api/blog-client"
import { AUTH_SESSION_CHANGE_EVENT, fetchAuthUser } from "@/lib/auth"
import type { BlogPostDetail } from "@/lib/types"

export function BlogPostView({
  post: initialPost,
  draftPreview = false,
}: {
  post: BlogPostDetail
  draftPreview?: boolean
}) {
  const [post, setPost] = useState(initialPost)

  useEffect(() => {
    setPost(initialPost)
  }, [initialPost])

  useEffect(() => {
    if (initialPost.is_public || draftPreview) return

    let cancelled = false

    async function loadMemberPost() {
      const user = await fetchAuthUser()
      if (!user || cancelled) return
      const full = await getBlogPostWithAuth(initialPost.slug)
      if (!cancelled && full) setPost(full)
    }

    void loadMemberPost()
    const onAuthChange = () => {
      void loadMemberPost()
    }
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, onAuthChange)
    return () => {
      cancelled = true
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, onAuthChange)
    }
  }, [initialPost.slug, initialPost.is_public, draftPreview])

  const isPublic = draftPreview || post.is_public === true

  return (
    <BlogContentGate
      isPublic={isPublic}
      commentSlug={post.slug}
      title={post.title}
      category={post.category}
      readTime={post.read_time}
      date={post.date}
      excerpt={post.excerpt}
    >
      {post.body?.trim() ? (
        <BlogArticleBody body={post.body} />
      ) : (
        <p className="text-gray-400">{post.excerpt}</p>
      )}
    </BlogContentGate>
  )
}
