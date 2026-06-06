import { notFound } from "next/navigation"
import { getBlogPost } from "@/lib/api/blog"
import { BlogPostView } from "@/components/blog-post-view"

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()
  return <BlogPostView post={post} />
}
