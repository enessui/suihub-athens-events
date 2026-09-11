import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

// Brand guideline: TWK Everett / ABC Camera are licensed — Inter is the
// approved fallback typeface for headlines and body copy.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SuiHub Events · Coworking Calendar',
  description:
    'Discover workshops, talks, socials and more happening at our coworking space every month.',
  icons: {
    icon: '/Sui_Symbol_Sea.png',
    apple: '/Sui_Symbol_Sea.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#4DA2FF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`light ${inter.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-white" />
        <div className="relative z-10">
          {children}
          <SiteFooter />
        </div>
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
