"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { RESOURCES_HUB_HREF, SITE_RESOURCES } from "@/lib/site-nav"

export function ResourcesDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={RESOURCES_HUB_HREF}
        className="flex items-center gap-1 font-medium text-gray-300 transition hover:text-white"
      >
        Resources
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#1a1d24] shadow-xl">
          <div className="py-2">
            {SITE_RESOURCES.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="block px-4 py-2.5 text-sm text-gray-300 transition hover:bg-green-600/20 hover:text-green-400"
                onClick={() => setIsOpen(false)}
              >
                {resource.title}
              </Link>
            ))}
            <div className="mt-2 border-t border-white/10 pt-2">
              <Link
                href={RESOURCES_HUB_HREF}
                className="block px-4 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-600/20"
                onClick={() => setIsOpen(false)}
              >
                View All Resources →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
