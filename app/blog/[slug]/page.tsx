import { notFound } from "next/navigation"
import { getBlogPost } from "@/lib/api/blog"
import { BlogPostView } from "@/components/blog-post-view"

/** Dynamic posts from the dashboard API (static `/blog/<slug>/` pages take precedence). */
export default async function BlogPostBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()
  return <BlogPostView post={post} />
}
