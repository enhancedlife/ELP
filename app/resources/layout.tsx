export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Member gating is handled per-page by ResourceContentGate (Django token auth).
  return children
}
