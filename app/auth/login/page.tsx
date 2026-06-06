"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { loginRequest, postAuthLandingPath } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || ""

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { user } = await loginRequest(email.trim(), password)
      const dest = redirectTo || postAuthLandingPath(user)
      router.push(dest)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6 bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Your password"
          className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div className="text-right">
        <Link href="/auth/forgot-password" className="text-sm text-green-400 hover:text-green-300 transition">
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider"
      >
        {loading ? "Logging In..." : "Log In"}
      </Button>

      <p className="text-center text-gray-400 text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="text-green-400 hover:text-green-300 transition">
          Sign up
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">
            Welcome Back
          </h1>
          <p className="text-gray-400 mt-2">
            Log in to access exclusive resources
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
