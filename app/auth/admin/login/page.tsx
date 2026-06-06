"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { adminLoginRequest } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminLoginRequest(email.trim(), password)
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">Admin Sign In</h1>
          <p className="text-gray-400 mt-2">Staff dashboard access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/20 text-white focus:border-green-500"
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
              className="bg-black/50 border-white/20 text-white focus:border-green-500"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? "Signing in…" : "Sign in to dashboard"}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            <Link href="/auth/login" className="text-green-400 hover:text-green-300 transition">Member sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
