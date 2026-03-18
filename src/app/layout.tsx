import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import InstallBanner from '@/components/InstallBanner'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'Reklamsidan',
    template: '%s | Reklamsidan',
  },
  description: 'Digital reklam som når rätt mottagare – för företag och privatpersoner.',
  metadataBase: new URL('https://www.reklamsidan.se'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Reklamsidan',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: 'https://www.reklamsidan.se',
    siteName: 'Reklamsidan',
    title: 'Reklamsidan – Digital reklam som når rätt mottagare',
    description: 'Reklamsidan kopplar ihop annonsörer med rätt målgrupp – privatpersoner och företag som faktiskt vill ta emot reklam.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Reklamsidan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reklamsidan – Digital reklam som når rätt mottagare',
    description: 'Reklamsidan kopplar ihop annonsörer med rätt målgrupp – privatpersoner och företag som faktiskt vill ta emot reklam.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" className={inter.variable}>
      <head>
        {/* Fånga beforeinstallprompt tidigt – innan React hydration */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__deferredInstallPrompt = e;
          });
        `}} />
      </head>
      <body>
        <ToastProvider>
          <InstallBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
