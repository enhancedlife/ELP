"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AUTH_SESSION_CHANGE_EVENT,
  fetchAuthUser,
  logoutRequest,
  userCanAccessDashboard,
  type AuthUser,
} from "@/lib/auth"

export function ClientHeaderAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      const authUser = await fetchAuthUser()
      if (!cancelled) {
        setUser(authUser)
        setIsLoading(false)
      }
    }

    void checkAuth()
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, checkAuth)
    window.addEventListener("storage", checkAuth)

    return () => {
      cancelled = true
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, checkAuth)
      window.removeEventListener("storage", checkAuth)
    }
  }, [])

  const handleSignOut = async () => {
    await logoutRequest()
    setUser(null)
    router.push("/")
    router.refresh()
  }

  if (isLoading) {
    return <div className="w-20 h-9" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white">
          <Link href="/auth/login">Log In</Link>
        </Button>
        <Button size="sm" asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
        <DropdownMenuItem asChild className="text-gray-300 hover:text-white cursor-pointer">
          <Link href="/portal">Member Portal</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:text-white cursor-pointer">
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        {userCanAccessDashboard(user) ? (
          <DropdownMenuItem asChild className="text-gray-300 hover:text-white cursor-pointer">
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={() => void handleSignOut()} className="text-gray-300 hover:text-white cursor-pointer">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ClientMobileAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      const authUser = await fetchAuthUser()
      if (!cancelled) {
        setUser(authUser)
        setIsLoading(false)
      }
    }

    void checkAuth()
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, checkAuth)
    window.addEventListener("storage", checkAuth)

    return () => {
      cancelled = true
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, checkAuth)
      window.removeEventListener("storage", checkAuth)
    }
  }, [])

  if (isLoading) {
    return null
  }

  if (user) {
    return (
      <Link
        href="/portal"
        className="p-2 rounded-lg text-white shadow-lg"
        style={{ backgroundColor: "#22272e", border: "1px solid rgba(255,255,255,0.3)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/auth/login"
        className="px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow-lg"
        style={{ backgroundColor: "#22272e", border: "1px solid rgba(255,255,255,0.3)" }}
      >
        Log In
      </Link>
      <Link
        href="/auth/sign-up"
        className="px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow-lg"
        style={{ backgroundColor: "#16a34a" }}
      >
        Sign Up
      </Link>
    </>
  )
}
