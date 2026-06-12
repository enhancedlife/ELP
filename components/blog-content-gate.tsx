"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AUTH_SESSION_CHANGE_EVENT, fetchAuthUser } from "@/lib/auth"

interface BlogContentGateProps {
  children: React.ReactNode
  /** Shown below the article for all visitors (e.g. public comments). */
  footer?: React.ReactNode
  title: string
  category: string
  readTime: string
  date: string
  excerpt: string
}

export function BlogContentGate({
  children,
  footer,
  title,
  category,
  readTime,
  date,
  excerpt,
}: BlogContentGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      const user = await fetchAuthUser()
      if (!cancelled) {
        setIsAuthenticated(!!user)
        setIsLoading(false)
      }
    }

    void checkAuth()
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, checkAuth)

    return () => {
      cancelled = true
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, checkAuth)
    }
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen text-white pt-24">
        <article className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-24 mb-6"></div>
              <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </article>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-white pt-24">
      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-green-400 hover:text-green-300 transition">
            ← Back to Blog
          </Link>

          <div className="mt-6">
            <span className="text-green-400 font-medium">{category}</span>
            <span className="text-gray-500 mx-3">•</span>
            <span className="text-gray-500">{readTime}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mt-4">{title}</h1>
          <p className="text-gray-500 mt-4">{date}</p>

          {isAuthenticated ? (
            <div className="mt-12 prose prose-invert prose-lg max-w-none">
              {children}
            </div>
          ) : (
            <div className="mt-12">
              <p className="text-gray-300 leading-relaxed text-lg">{excerpt}</p>

              <div className="mt-12 bg-[#1a1d24] border border-white/10 rounded-xl p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <h2 className="text-xl font-heading font-bold uppercase tracking-wider text-white mb-3">
                  Members Only Content
                </h2>

                <p className="text-gray-400 mb-6">
                  Create a free account to read this article and access all our exclusive guides, calculators, and protocols.
                </p>

                <div className="space-y-3">
                  <Link
                    href={`/auth/sign-up?redirect=${encodeURIComponent(pathname)}`}
                    className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider rounded-lg transition"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                    className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition"
                  >
                    Already have an account? Log In
                  </Link>
                </div>
              </div>
            </div>
          )}

          {footer ? <div className="mt-12">{footer}</div> : null}
        </div>
      </article>
    </main>
  )
}
