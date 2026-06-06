"use client"

import { useState } from "react"
import Link from "next/link"
import { forgotPasswordRequest } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { detail } = await forgotPasswordRequest(email)
      setMessage(detail)
      setEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">Forgot Password</h1>
          <p className="text-gray-400 mt-2">We&apos;ll email you a reset link if an account exists.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          ) : null}
          {message ? (
            <div className="bg-green-600/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">{message}</div>
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

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? "Sending…" : "Send reset link"}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            <Link href="/auth/login" className="text-green-400 hover:text-green-300 transition">Back to sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
