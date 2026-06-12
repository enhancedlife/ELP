const rawBackend =
  process.env.BACKEND_URL ||
  process.env.API_REWRITE_TARGET ||
  "http://127.0.0.1:8000"
/** Avoid Node resolving localhost → ::1 when Django listens on 127.0.0.1 only (common on Windows). */
const origin = rawBackend
  .replace(/\/$/, "")
  .replace(/(^https?:\/\/)localhost\b/i, (_, scheme) => `${scheme}127.0.0.1`)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/dashboard/login", destination: "/auth/admin/login", permanent: false },
      { source: "/dashboard/login/", destination: "/auth/admin/login", permanent: false },
      { source: "/login", destination: "/auth/login", permanent: false },
      { source: "/register", destination: "/auth/sign-up", permanent: false },
      { source: "/forgot-password", destination: "/auth/forgot-password", permanent: false },
      { source: "/reset-password", destination: "/auth/reset-password", permanent: false },
    ]
  },
  async rewrites() {
    return {
      afterFiles: [
        // Dashboard BFF — same rewrite tier as /api/auth (beforeFiles breaks in production standalone).
        { source: "/api/dashboard/:path*", destination: `${origin}/api/dashboard/:path*` },
        { source: "/api/auth/:path*", destination: `${origin}/api/auth/:path*` },
        { source: "/api/portal/:path*", destination: `${origin}/api/portal/:path*` },
        { source: "/api/landing-pages/:path+", destination: `${origin}/api/landing-pages/:path+` },
        { source: "/api/newsletter/:path*", destination: `${origin}/api/newsletter/:path*` },
        { source: "/api/contact", destination: `${origin}/api/contact` },
        { source: "/api/sponsors", destination: `${origin}/api/sponsors` },
        { source: "/api/blog/:path*", destination: `${origin}/api/blog/:path*` },
        { source: "/api/site-branding", destination: `${origin}/api/site-branding` },
        { source: "/api/health", destination: `${origin}/api/health` },
        { source: "/api/analytics/visit", destination: `${origin}/api/analytics/visit` },
        { source: "/media/:path*", destination: `${origin}/media/:path*` },
      ],
    }
  },
}

export default nextConfig
