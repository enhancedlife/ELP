"use client"

import { PortalAuthGate, PortalAuthProvider } from "@/components/providers/portal-auth-provider"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalAuthProvider>
      <PortalAuthGate>{children}</PortalAuthGate>
    </PortalAuthProvider>
  )
}
