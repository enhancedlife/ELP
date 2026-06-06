"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"

const resources = [
  { title: "Peptide Calculator", href: "/resources/peptide-calculator" },
  { title: "Reconstitution Guide", href: "/resources/reconstitution-guide" },
  { title: "Injection Guide", href: "/resources/injection-guide" },
  { title: "Bloodwork Guide", href: "/resources/bloodwork-guide" },
  { title: "Beginner TRT Guide", href: "/resources/beginner-trt-guide" },
  { title: "Fat Loss Protocols", href: "/resources/fat-loss-protocols" },
]

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
        href="/resources"
        className="flex items-center gap-1 text-gray-300 hover:text-white transition font-medium"
      >
        Resources
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1d24] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          <div className="py-2">
            {resources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-green-600/20 hover:text-green-400 transition"
                onClick={() => setIsOpen(false)}
              >
                {resource.title}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              <Link
                href="/resources"
                className="block px-4 py-2.5 text-sm text-green-400 hover:bg-green-600/20 transition font-medium"
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
