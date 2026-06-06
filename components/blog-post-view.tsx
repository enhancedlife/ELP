"use client"

import { BlogContentGate } from "@/components/blog-content-gate"
import { BlogArticleBody } from "@/components/blog-article-body"
import type { BlogPostDetail } from "@/lib/types"

export function BlogPostView({ post }: { post: BlogPostDetail }) {
  return (
    <BlogContentGate
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
