"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { logoutMockSession } from "@/app/auth/login/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderAuthProps {
  user: { id: string; email?: string } | null
}

export function HeaderAuth({ user }: HeaderAuthProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    // Clear mock session via server action
    await logoutMockSession()
    
    // Also sign out from Supabase if connected
    if (supabase) {
      await supabase.auth.signOut()
    }
    
    router.push("/")
    router.refresh()
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-[#1a1d24] border-white/10">
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
          Log In
        </Button>
      </Link>
      <Link href="/auth/sign-up">
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          Sign Up
        </Button>
      </Link>
    </div>
  )
}
