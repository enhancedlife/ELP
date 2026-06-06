"use client"

import Link from "next/link"
import { backendUrl } from "@/lib/backend-public"

function adminBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv
  return backendUrl("/admin")
}

export default function StaffPage() {
  const adminUrl = adminBase()

  return (
    <main className="min-h-screen text-white pt-24 pb-16 px-6">
      <div className="max-w-xl mx-auto bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <h1 className="text-3xl font-heading font-bold uppercase tracking-wide">Staff Access</h1>
        <p className="mt-4 text-gray-400 leading-relaxed">
          Content is managed in <strong className="text-white">Django Admin</strong> on the API server.
          The Next.js app dashboard is at{" "}
          <Link href="/dashboard" className="text-green-400 hover:text-green-300 transition">/dashboard</Link>.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-gray-400">
          <li><strong className="text-white">Django Admin</strong> — landing pages, sponsors, users</li>
          <li>Django Admin runs on port 8000, not on the Next.js port</li>
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={`${adminUrl}/`}
            rel="nofollow"
            className="inline-flex items-center justify-center px-5 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
          >
            Open Django Admin
          </a>
          <Link
            href="/auth/admin/login"
            className="inline-flex items-center justify-center px-5 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
          >
            App dashboard login
          </Link>
        </div>
      </div>
    </main>
  )
}
