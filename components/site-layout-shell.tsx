"use client"

import { usePathname } from "next/navigation"

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
      {!hideSiteChrome ? header : null}
      {children}
      {!hideSiteChrome ? footer : null}
    </>
  )
}
