import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/** Inject server secret for dashboard BFF rewrites (next.config beforeFiles → Django). */
function withDashboardSecret(request: NextRequest): NextRequest {
  const secret = (process.env.DASHBOARD_SERVER_SECRET || '').trim()
  if (!secret || !request.nextUrl.pathname.startsWith('/api/dashboard/')) {
    return request
  }
  const headers = new Headers(request.headers)
  headers.set('X-Dashboard-Secret', secret)
  return new NextRequest(request.url, { headers })
}

export async function middleware(request: NextRequest) {
  return await updateSession(withDashboardSecret(request))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
