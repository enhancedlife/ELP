"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ClientMobileAuth } from "@/components/client-header-auth"
import { SiteLogo } from "@/components/site-logo"
import type { SiteBranding } from "@/lib/types"
import {
  MAIN_NAV_LINKS,
  RESOURCES_HUB_HREF,
  SITE_RESOURCES,
} from "@/lib/site-nav"

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/g/1CsYByUzEd/?mibextid=wwXIfr",
    hoverClass: "hover:text-blue-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me/+IW8Vrq6b_ks4Yjkx",
    hoverClass: "hover:text-sky-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
] as const

export function MobileNav({ branding }: { branding?: SiteBranding | null }) {
  const [open, setOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const closeMenu = () => {
    setOpen(false)
    setResourcesOpen(false)
  }

  const menuOverlay =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-[#0a0c0f] text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-6">
              <SiteLogo
                branding={branding}
                textClassName="text-xl text-white"
                onClick={closeMenu}
              />
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="cursor-pointer rounded-lg p-2 text-white shadow-lg"
                style={{ backgroundColor: "#22272e", border: "1px solid rgba(255,255,255,0.4)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
              <div className="border-b border-white/10 pb-4">
                <button
                  type="button"
                  aria-expanded={resourcesOpen}
                  onClick={() => setResourcesOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between py-1 text-2xl font-heading uppercase leading-normal tracking-wide text-white transition hover:text-green-400"
                >
                  <span>Resources</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 shrink-0 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {resourcesOpen && (
                  <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
                    {SITE_RESOURCES.map((resource) => (
                      <Link
                        key={resource.href}
                        href={resource.href}
                        onClick={closeMenu}
                        className="block py-0.5 text-lg leading-normal text-gray-300 transition hover:text-green-400"
                      >
                        {resource.title}
                      </Link>
                    ))}
                    <Link
                      href={RESOURCES_HUB_HREF}
                      onClick={closeMenu}
                      className="block py-0.5 text-lg font-medium leading-normal text-green-400 transition hover:text-green-300"
                    >
                      View All Resources →
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {MAIN_NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="py-1 text-2xl font-heading uppercase leading-normal tracking-wide text-white transition hover:text-green-400"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:gap-6">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 text-white transition ${social.hoverClass}`}
                  >
                    {social.icon}
                    <span>{social.label}</span>
                  </a>
                ))}
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="flex items-center gap-2 md:hidden">
      <ClientMobileAuth />
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg p-2 text-white shadow-lg"
        style={{ backgroundColor: "#22272e", border: "1px solid rgba(255,255,255,0.4)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {menuOverlay}
    </div>
  )
}
