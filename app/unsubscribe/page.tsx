"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function UnsubscribeInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("err")
      setMessage("Missing token. Open the unsubscribe link from your email.")
      return
    }
    let cancelled = false
    ;(async () => {
      setStatus("loading")
      try {
        const res = await fetch(
          `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
          { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" },
        )
        const data = (await res.json().catch(() => ({}))) as { detail?: string }
        if (cancelled) return
        if (res.ok) {
          setStatus("ok")
          setMessage(typeof data.detail === "string" ? data.detail : "You are unsubscribed.")
        } else {
          setStatus("err")
          setMessage(typeof data.detail === "string" ? data.detail : `Request failed (${res.status}).`)
        }
      } catch {
        if (!cancelled) {
          setStatus("err")
          setMessage("Could not reach the server.")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className="min-h-screen text-white pt-24 pb-16 px-6">
      <div className="max-w-lg mx-auto bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <h1 className="text-2xl font-heading font-bold uppercase tracking-wide">Unsubscribe</h1>
        {status === "loading" ? <p className="mt-4 text-gray-400">Processing…</p> : null}
        {status === "ok" ? <p className="mt-4 text-green-400">{message}</p> : null}
        {status === "err" ? <p className="mt-4 text-red-400">{message}</p> : null}
        <Link href="/" className="mt-6 inline-block text-sm text-green-400 hover:text-green-300 transition">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<main className="min-h-screen text-white pt-24 px-6"><p className="text-gray-400">Loading…</p></main>}>
      <UnsubscribeInner />
    </Suspense>
  )
}
