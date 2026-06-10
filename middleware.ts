import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

/** Inject X-Dashboard-Secret for /api/dashboard/* rewrites (required when DEBUG=0 on Django). */
function withDashboardSecretHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers)
  const secret = (process.env.DASHBOARD_SERVER_SECRET || '').trim()
  if (secret && request.nextUrl.pathname.startsWith('/api/dashboard/')) {
    headers.set('X-Dashboard-Secret', secret)
  }
  return headers
}

export async function middleware(request: NextRequest) {
  const headers = withDashboardSecretHeaders(request)
  const secretPatched =
    headers.get('X-Dashboard-Secret') !== request.headers.get('X-Dashboard-Secret')

  const res = await updateSession(request)

  if (!secretPatched) {
    return res
  }

  const out = NextResponse.next({
    request: { headers },
  })
  for (const cookie of res.cookies.getAll()) {
    out.cookies.set(cookie.name, cookie.value, cookie)
  }
  return out
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
