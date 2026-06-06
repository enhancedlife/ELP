"use client"

import { useState } from "react"
import { postNewsletterSubscribe } from "@/lib/api/website"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    const { ok } = await postNewsletterSubscribe({ email: email.trim() })

    if (ok) {
      setStatus("success")
      setEmail("")
    } else {
      setStatus("error")
      setErrorMessage("Could not subscribe. Please try again.")
    }
  }

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 text-center">
      <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h2 className="text-3xl md:text-4xl font-heading font-bold mt-6 uppercase tracking-wide">
        Stay Enhanced
      </h2>

      <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
        Get the latest articles, guides, and exclusive deals delivered straight to your inbox.
        No spam, just valuable content for your optimization journey.
      </p>

      {status === "success" ? (
        <div className="mt-8 bg-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 font-semibold">You&apos;re subscribed!</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Check your inbox for updates from Your Enhanced Life.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8">
          {status === "error" && errorMessage ? (
            <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:border-green-500 focus:outline-none transition text-center sm:text-left"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed transition px-8 py-4 rounded-xl font-heading font-semibold uppercase tracking-wider whitespace-nowrap"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Weekly updates</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Exclusive deals</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>No spam</span>
        </div>
      </div>
    </div>
  )
}
