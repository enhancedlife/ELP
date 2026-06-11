"use client"

import { usePathname } from "next/navigation"
import { SiteVisitTracker } from "@/components/site-visit-tracker"

export function SiteLayoutShell({
  header,
  footer,
  children,
}: {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hideSiteChrome = pathname?.startsWith("/dashboard") ?? false

  return (
    <>
      {!hideSiteChrome ? <SiteVisitTracker /> : null}
      {!hideSiteChrome ? header : null}
      {children}
      {!hideSiteChrome ? footer : null}
    </>
  )
}
