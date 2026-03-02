import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Reklamsidan',
    template: '%s | Reklamsidan',
  },
  description: 'Digital reklam som når rätt mottagare – för företag och privatpersoner.',
  metadataBase: new URL('https://www.reklamsidan.se'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
