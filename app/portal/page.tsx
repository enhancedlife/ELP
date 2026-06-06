"use client"

import Link from "next/link"
import { PortalSignOutButton, usePortalAuth } from "@/components/providers/portal-auth-provider"
import { isDashboardManager, userCanAccessDashboard } from "@/lib/auth"
import { MEMBER_TOOLS_LINKS } from "@/lib/member-tools"

export default function MemberPortalPage() {
  const { user } = usePortalAuth()
  const canAdmin = user ? userCanAccessDashboard(user) : false
  const staffBlurb =
    user && isDashboardManager(user)
      ? "You can open the staff dashboard for the tools and areas you have access to."
      : "Open the staff dashboard for content, email, and other admin tools."

  return (
    <main className="min-h-screen text-white pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-wide">
              Member Portal
            </h1>
            <p className="mt-2 text-gray-400">
              Signed in as <span className="font-medium text-white">{user?.email}</span>
            </p>
          </div>
          <PortalSignOutButton />
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-heading font-bold uppercase tracking-wider">Your account & resources</h2>
          <p className="mt-2 text-gray-400 text-sm">
            Quick links to your profile and member-only tools.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
            >
              Edit profile
            </Link>
            {MEMBER_TOOLS_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {canAdmin ? (
          <div className="bg-green-600/10 rounded-2xl p-8 border border-green-500/30">
            <h2 className="text-xl font-heading font-bold uppercase tracking-wider text-green-400">Staff dashboard</h2>
            <p className="mt-2 text-gray-400 text-sm">{staffBlurb}</p>
            <Link
              href="/dashboard"
              className="inline-flex mt-6 px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
            >
              Open admin dashboard
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  )
}
