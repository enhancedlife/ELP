"use client"

import { useState, useEffect, ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AUTH_SESSION_CHANGE_EVENT, fetchAuthUser } from "@/lib/auth"

interface ResourceContentGateProps {
  children: ReactNode
  title: string
  description: string
}

export function ResourceContentGate({ children, title, description }: ResourceContentGateProps) {
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
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-white/10 rounded mb-6"></div>
              <div className="h-10 w-3/4 bg-white/10 rounded mb-4"></div>
              <div className="h-6 w-1/2 bg-white/10 rounded"></div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen text-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/resources" className="text-green-400 hover:text-green-300 transition">
              ← Back to Resources
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mt-6 uppercase tracking-wide">{title}</h1>
            <p className="mt-4 text-xl text-gray-400">{description}</p>

            <div className="mt-12">
              <div className="bg-[#1a1d24] border border-white/10 rounded-xl p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <h2 className="text-xl font-heading font-bold uppercase tracking-wider text-white mb-3">
                  Members Only Content
                </h2>

                <p className="text-gray-400 mb-6">
                  Create a free account to access this resource and all our exclusive guides, calculators, and protocols.
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
          </div>
        </section>
      </main>
    )
  }

  return <>{children}</>
}
