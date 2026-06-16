import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Link from 'next/link'
import { Toaster } from 'sonner'
import './globals.css'
import { ResourcesDropdown } from '@/components/resources-dropdown'
import { MobileNav } from '@/components/mobile-nav'
import { ClientHeaderAuth } from '@/components/client-header-auth'
import { SiteLogo } from '@/components/site-logo'
import { HOME_NAV_LINK, MAIN_NAV_LINKS } from '@/lib/site-nav'
import { SiteLayoutShell } from '@/components/site-layout-shell'
import { ThemeProvider } from '@/components/theme-provider'
import {
  brandingMetadataIcons,
  fetchSiteBrandingServer,
  siteDisplayName,
} from '@/lib/site-branding'
import type { SiteBranding } from '@/lib/types'

const oswald = Oswald({ subsets: ["latin"], variable: '--font-oswald' })
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' })

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchSiteBrandingServer()
  const siteName = siteDisplayName(branding)
  return {
    title: siteName,
    description: 'A community focused on peptides, TRT/HRT, recovery, longevity, and performance optimization.',
    generator: 'v0.app',
    icons: brandingMetadataIcons(branding),
  }
}

function Header({ branding }: { branding: SiteBranding }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-3 md:py-4 flex items-center justify-between gap-4">
        <SiteLogo
          branding={branding}
          textClassName="text-lg text-white"
        />
        
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href={HOME_NAV_LINK.href}
            className="text-gray-300 hover:text-white transition font-medium"
          >
            {HOME_NAV_LINK.title}
          </Link>
          <ResourcesDropdown />
          {MAIN_NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-white transition font-medium"
            >
              {item.title}
            </Link>
          ))}
          <div className="flex items-center gap-4 ml-2 pl-4 border-l border-white/20">
            <a 
              href="https://www.facebook.com/share/g/1CsYByUzEd/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-400 transition"
              aria-label="Facebook Group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://t.me/+IW8Vrq6b_ks4Yjkx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-sky-400 transition"
              aria-label="Telegram Group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
          <ClientHeaderAuth />
        </nav>

        <MobileNav branding={branding} />
      </div>
    </header>
  )
}

function Footer({ branding }: { branding: SiteBranding }) {
  const siteName = siteDisplayName(branding)
  return (
    <footer className="border-t border-white/10 py-10 px-6 bg-black">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <SiteLogo
            branding={branding}
            textClassName="text-2xl text-white"
            imageClassName="h-12 sm:h-14 max-w-[280px]"
          />
        </div>

        <div className="flex gap-6 text-gray-300">
          <Link href={HOME_NAV_LINK.href} className="hover:text-white transition">
            {HOME_NAV_LINK.title}
          </Link>
          <Link href="/resources" className="hover:text-white transition">Resources</Link>
          {MAIN_NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition">
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a 
            href="https://www.facebook.com/share/g/1CsYByUzEd/?mibextid=wwXIfr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition"
            aria-label="Facebook Group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a 
            href="https://t.me/+IW8Vrq6b_ks4Yjkx" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-sky-400 transition"
            aria-label="Telegram Group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        <p className="mt-2">Educational content only. Not medical advice.</p>
      </div>
    </footer>
  )
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const branding = await fetchSiteBrandingServer()

  return (
    <html 
      lang="en" 
      className={`${oswald.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased text-white min-h-screen" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="elp-theme"
        >
          <SiteLayoutShell header={<Header branding={branding} />} footer={<Footer branding={branding} />}>
            {children}
          </SiteLayoutShell>
          <Toaster theme="dark" position="top-center" richColors />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
