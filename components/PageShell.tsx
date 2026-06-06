import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const widths = {
  landing: "max-w-3xl",
  article: "max-w-4xl",
  wide: "max-w-6xl",
  xl: "max-w-screen-2xl",
}

export type PageShellVariant = keyof typeof widths

type PageShellProps = {
  children: ReactNode
  variant?: PageShellVariant
  className?: string
}

export function PageShell({ children, variant = "article", className }: PageShellProps) {
  const surface = variant === "landing" || variant === "article"
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 py-10 lg:px-8 lg:py-14",
        widths[variant],
        className,
      )}
    >
      {surface ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6 sm:p-8 lg:p-10">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
