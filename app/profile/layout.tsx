"use client"

import { PortalAuthGate, PortalAuthProvider } from "@/components/providers/portal-auth-provider"

export default function ProfileLayout({
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
