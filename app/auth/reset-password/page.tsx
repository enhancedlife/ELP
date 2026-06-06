"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { passwordResetConfirmRequest } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const uid = searchParams.get("uid")?.trim() ?? ""
  const token = searchParams.get("token")?.trim() ?? ""
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const linkInvalid = !uid || !token

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (linkInvalid) return
    if (password !== passwordConfirm) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await passwordResetConfirmRequest({
        uid,
        token,
        password,
        password_confirmation: passwordConfirm,
      })
      router.replace("/auth/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
      {linkInvalid ? (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          This reset link is invalid or expired.{" "}
          <Link href="/auth/forgot-password" className="underline">Request a new one</Link>.
        </div>
      ) : null}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">New password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={linkInvalid}
          className="bg-black/50 border-white/20 text-white focus:border-green-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm" className="text-gray-300">Confirm password</Label>
        <Input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          minLength={8}
          disabled={linkInvalid}
          className="bg-black/50 border-white/20 text-white focus:border-green-500"
        />
      </div>

      <Button type="submit" disabled={loading || linkInvalid} className="w-full bg-green-600 hover:bg-green-700">
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">Reset Password</h1>
          <p className="text-gray-400 mt-2">Choose a new password for your account.</p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-400">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
