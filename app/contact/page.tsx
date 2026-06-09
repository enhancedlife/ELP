"use client"

import { useState } from "react"
import { postContactForm } from "@/lib/api/website"

const SUBJECT_TO_ISSUE: Record<string, "order_issue" | "account" | "website_technical" | "partnership" | "other"> = {
  general: "other",
  sponsorship: "partnership",
  feedback: "other",
  content: "other",
  support: "website_technical",
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await postContactForm({
      name: formData.name.trim(),
      email: formData.email.trim(),
      issue_type: SUBJECT_TO_ISSUE[formData.subject] ?? "other",
      message: formData.message.trim(),
    })

    setSubmitting(false)

    if (!result.ok) {
      setError(result.detail ?? "Could not send message. Please try again.")
      return
    }

    setSubmitted(true)
  }

  return (
    <main className="min-h-screen text-white pt-24">
      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">
            Have a question, suggestion, or want to collaborate? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mt-6">Message Sent!</h2>
                <p className="mt-3 text-gray-400">
                  Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ name: "", email: "", subject: "general", message: "" })
                  }}
                  className="mt-6 text-green-400 hover:text-green-300 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Send a Message</h2>

                {error ? (
                  <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="sponsorship">Sponsorship Opportunity</option>
                      <option value="feedback">Feedback or Suggestion</option>
                      <option value="content">Content Request</option>
                      <option value="support">Technical Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed transition px-6 py-4 rounded-xl font-semibold"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Other Ways to Connect</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a
                      href="mailto:admin@yourenhancedlife.com"
                      className="text-gray-400 mt-1 inline-block hover:text-green-400 transition"
                    >
                      admin@yourenhancedlife.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Facebook Group</h3>
                    <a 
                      href="https://www.facebook.com/share/g/1CsYByUzEd/?mibextid=wwXIfr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 mt-1 inline-block transition"
                    >
                      Join our Facebook community →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-sky-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Telegram Group</h3>
                    <a 
                      href="https://t.me/+IW8Vrq6b_ks4Yjkx" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 mt-1 inline-block transition"
                    >
                      Join our Telegram community →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Response Time</h3>
                    <p className="text-gray-400 mt-1">We typically respond within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-green-400">Do you provide medical advice?</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    No. All content is for educational purposes only. Always consult with a healthcare provider.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-400">How do I become a sponsor?</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Use the contact form with &quot;Sponsorship Opportunity&quot; selected and tell us about your company.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-400">Can I suggest a topic?</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Absolutely! We love hearing what the community wants to learn about.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-semibold text-orange-400">Important Note</h3>
              <p className="mt-2 text-gray-400 text-sm">
                Your Enhanced Life provides educational content only. We cannot and do not 
                provide medical advice, diagnoses, or treatment recommendations. Please 
                consult qualified healthcare professionals for medical guidance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
