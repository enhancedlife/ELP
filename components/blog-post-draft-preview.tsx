"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BlogPostView } from "@/components/blog-post-view"
import { getBlogPostWithAuth } from "@/lib/api/blog-client"
import { fetchAuthUser, isDashboardFullAdmin } from "@/lib/auth"
import type { BlogPostDetail } from "@/lib/types"

type PreviewState = "loading" | "forbidden" | "not_found" | "ready"

export function BlogPostDraftPreview({ slug }: { slug: string }) {
  const [state, setState] = useState<PreviewState>("loading")
  const [post, setPost] = useState<BlogPostDetail | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const user = await fetchAuthUser()
      if (!isDashboardFullAdmin(user)) {
        if (!cancelled) setState("forbidden")
        return
      }

      const loaded = await getBlogPostWithAuth(slug)
      if (cancelled) return

      if (!loaded || loaded.is_published === true) {
        setState("not_found")
        setPost(null)
        return
      }

      setPost(loaded)
      setState("ready")
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (state === "loading") {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-400 pt-24">
        Loading draft preview…
      </div>
    )
  }

  if (state === "forbidden") {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-6 pt-24 text-center">
        <p className="text-lg text-white">Draft preview is for admin accounts only.</p>
        <Link href="/login" className="text-green-400 hover:underline">
          Sign in as admin
        </Link>
      </div>
    )
  }

  if (state === "not_found" || !post) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-400 pt-24">
        Draft not found.
      </div>
    )
  }

  return (
    <div className="pt-24">
      <div className="mx-auto mb-6 max-w-3xl px-6">
        <p className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-100">
          <strong>Draft preview</strong> — this post is not published and is only visible to you.
        </p>
      </div>
      <BlogPostView post={post} draftPreview />
    </div>
  )
}
