"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { postAuthLandingPath, registerRequest } from "@/lib/auth"
import { postNewsletterSubscribe } from "@/lib/api/website"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

function SignUpForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || ""

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const { user } = await registerRequest({
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })

      if (newsletterOptIn) {
        await postNewsletterSubscribe({ email: email.trim(), name: `${firstName} ${lastName}`.trim() })
      }

      const dest = redirectTo || postAuthLandingPath(user)
      router.push(dest)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-6 bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-white/10">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-300">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-gray-300">Last name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

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
          minLength={8}
          className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500">Minimum 8 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm" className="text-gray-300">Confirm password</Label>
        <Input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="newsletter"
          checked={newsletterOptIn}
          onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
          className="border-white/20 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 mt-0.5"
        />
        <Label htmlFor="newsletter" className="text-gray-400 text-sm cursor-pointer leading-relaxed">
          Subscribe to our newsletter for tips on peptides, TRT, and performance optimization
        </Label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </Button>

      <p className="text-center text-gray-400 text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-green-400 hover:text-green-300 transition">
          Log in
        </Link>
      </p>
    </form>
  )
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">
            Create Account
          </h1>
          <p className="text-gray-400 mt-2">
            Join the community and unlock exclusive resources
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <SignUpForm />
        </Suspense>
      </div>
    </main>
  )
}
