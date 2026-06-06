/** Routes gated behind member sign-in (Tools & Resources). */

export const MEMBER_TOOLS_LINKS = [
  { href: "/resources/peptide-calculator", label: "Peptide Calculator" },
  { href: "/resources/reconstitution-guide", label: "Reconstitution Guide" },
  { href: "/resources/injection-guide", label: "Injection Guide" },
  { href: "/resources/bloodwork-guide", label: "Bloodwork Guide" },
  { href: "/resources/beginner-trt-guide", label: "Beginner TRT Guide" },
  { href: "/resources/fat-loss-protocols", label: "Fat Loss Protocols" },
  { href: "/faq", label: "FAQ" },
] as const

export function isMemberToolsPath(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/resources")) return true
  return MEMBER_TOOLS_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  )
}
