"use client"

import { blogBlocksToHtml, parseBlogBody } from "@/lib/blog-body-blocks"
import { cn } from "@/lib/utils"

type BlogArticleBodyProps = {
  body: string
  className?: string
}

/** Renders blog post body — block JSON or legacy HTML — with ELP article styling */
export function BlogArticleBody({ body, className }: BlogArticleBodyProps) {
  const blocks = parseBlogBody(body)
  const html = blocks ? blogBlocksToHtml(blocks) : body?.trim() ?? ""

  if (!html) return null

  return (
    <div
      className={cn("blog-article-body max-w-none text-gray-300 [&_p]:text-justify", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
