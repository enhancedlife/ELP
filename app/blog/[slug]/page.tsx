import { notFound } from "next/navigation"
import { getBlogPost } from "@/lib/api/blog"
import { BlogPostView } from "@/components/blog-post-view"
import { BlogPostDraftPreview } from "@/components/blog-post-draft-preview"

/** Dynamic posts from the dashboard API (static `/blog/<slug>/` pages take precedence). */
export default async function BlogPostBySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams

  if (preview === "1") {
    return <BlogPostDraftPreview slug={slug} />
  }

  const post = await getBlogPost(slug)
  if (!post) notFound()
  return <BlogPostView post={post} />
}
