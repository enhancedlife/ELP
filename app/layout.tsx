import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Link from 'next/link'
import { Toaster } from 'sonner'
import './globals.css'
import { ResourcesDropdown } from '@/components/resources-dropdown'
import { ClientHeaderAuth, ClientMobileAuth } from '@/components/client-header-auth'
import { SiteLayoutShell } from '@/components/site-layout-shell'
import { ThemeProvider } from '@/components/theme-provider'

const oswald = Oswald({ subsets: ["latin"], variable: '--font-oswald' })
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Your Enhanced Life',
  description: 'A community focused on peptides, TRT/HRT, recovery, longevity, and performance optimization.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-heading font-bold text-white hover:text-green-400 transition uppercase tracking-wider">
          Your Enhanced Life
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <ResourcesDropdown />
          <Link href="/blog" className="text-gray-300 hover:text-white transition font-medium">
            Blog
          </Link>
          <Link href="/sponsors" className="text-gray-300 hover:text-white transition font-medium">
            Sponsors
          </Link>
          <Link href="/contact" className="text-gray-300 hover:text-white transition font-medium">
            Contact
          </Link>
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

        <MobileNav />
      </div>
    </header>
  )
}

function MobileNav() {
  return (
    <div className="md:hidden flex items-center gap-2">
      <ClientMobileAuth />
      <input type="checkbox" id="mobile-menu" className="peer hidden" />
      <label 
        htmlFor="mobile-menu" 
        className="cursor-pointer text-white p-2 rounded-lg shadow-lg"
        style={{ backgroundColor: '#22272e', border: '1px solid rgba(255,255,255,0.4)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>
      <div 
        className="fixed inset-0 z-50 translate-x-full peer-checked:translate-x-0 transition-transform text-white"
        style={{ background: '#0a0c0f' }}
      >
        <div className="h-full w-full" style={{ background: '#0a0c0f' }}>
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Link href="/" className="text-xl font-heading font-bold uppercase tracking-wider text-white">Your Enhanced Life</Link>
            <label 
              htmlFor="mobile-menu" 
              className="cursor-pointer p-2 rounded-lg shadow-lg text-white"
              style={{ backgroundColor: '#22272e', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </label>
          </div>
          <nav className="flex flex-col p-6 gap-6" style={{ background: '#0a0c0f' }}>
            <Link href="/resources" className="text-2xl font-heading text-white hover:text-green-400 transition uppercase tracking-wide">Resources</Link>
            <Link href="/blog" className="text-2xl font-heading text-white hover:text-green-400 transition uppercase tracking-wide">Blog</Link>
            <Link href="/sponsors" className="text-2xl font-heading text-white hover:text-green-400 transition uppercase tracking-wide">Sponsors</Link>
            <Link href="/contact" className="text-2xl font-heading text-white hover:text-green-400 transition uppercase tracking-wide">Contact</Link>
            <div className="flex items-center gap-6 pt-6 border-t border-white/10">
              <a 
                href="https://www.facebook.com/share/g/1CsYByUzEd/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white hover:text-blue-400 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
              <a 
                href="https://t.me/+IW8Vrq6b_ks4Yjkx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white hover:text-sky-400 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Telegram</span>
              </a>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 px-6 bg-black/40 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <Link href="/" className="text-2xl font-heading font-bold hover:text-green-400 transition uppercase tracking-wider">
            Your Enhanced Life
          </Link>
          <p className="text-gray-400 mt-2">
            Enhance. Optimize. Thrive.
          </p>
        </div>

        <div className="flex gap-6 text-gray-300">
          <Link href="/resources" className="hover:text-white transition">Resources</Link>
          <Link href="/blog" className="hover:text-white transition">Blog</Link>
          <Link href="/sponsors" className="hover:text-white transition">Sponsors</Link>
          <Link href="/contact" className="hover:text-white transition">Contact</Link>
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
        <p>&copy; {new Date().getFullYear()} Your Enhanced Life. All rights reserved.</p>
        <p className="mt-2">Educational content only. Not medical advice.</p>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
          <SiteLayoutShell header={<Header />} footer={<Footer />}>
            {children}
          </SiteLayoutShell>
          <Toaster theme="dark" position="top-center" richColors />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
