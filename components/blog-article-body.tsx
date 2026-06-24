"use client"

import { blogBlocksToHtml, parseBlogBody } from "@/lib/blog-body-blocks"
import { cn } from "@/lib/utils"

type BlogArticleBodyProps = {
  body: string
  className?: string
  /** Sponsor pages use tighter heading spacing than blog articles. */
  tone?: "blog" | "sponsor" | "sponsor-featured"
}

const SPONSOR_TONE_CLASS =
  "[&>.block-h2:first-of-type]:!mt-0 [&>.block-h2:first-of-type]:!mb-8 [&>.block-h2]:text-white " +
  "[&>.block-h2:nth-of-type(2)]:!mt-16 [&>.block-h2:nth-of-type(2)]:!mb-6 [&>.block-h2:nth-of-type(2)]:text-center [&>.block-h2:nth-of-type(2)]:!text-3xl md:[&>.block-h2:nth-of-type(2)]:!text-4xl " +
  "[&_.sponsor-col-title]:mt-0 [&_.sponsor-two-col_.sponsor-col-title]:text-xl " +
  "[&>.block-h3]:!mt-6 [&>.block-h3]:!mb-3 [&>.block-h3]:text-center [&>.block-h3]:max-w-md [&>.block-h3]:mx-auto"

const SPONSOR_FEATURED_TONE_CLASS =
  "[&_.sponsor-three-col_.sponsor-col-title]:mt-0 [&_.sponsor-three-col_.sponsor-col-title]:mb-0"

/** Renders blog post body — block JSON or legacy HTML — with ELP article styling */
export function BlogArticleBody({ body, className, tone = "blog" }: BlogArticleBodyProps) {
  const blocks = parseBlogBody(body)
  const html = blocks ? blogBlocksToHtml(blocks) : body?.trim() ?? ""

  if (!html) return null

  const toneClass =
    tone === "sponsor"
      ? SPONSOR_TONE_CLASS
      : tone === "sponsor-featured"
        ? SPONSOR_FEATURED_TONE_CLASS
        : ""

  return (
    <div
      className={cn(
        "blog-article-body max-w-none text-gray-300 [&_p]:text-justify",
        toneClass,
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
