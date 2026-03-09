import type { NextConfig } from 'next'

const securityHeaders = [
  // Förhindrar att sidan laddas i en iframe (clickjacking-skydd)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Förhindrar att webbläsaren gissar MIME-typ (MIME sniffing)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Styr hur mycket referrer-information som skickas
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Tillåter bara HTTPS i ett år (skickas bara i produktion)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Begränsar vilka API:er som får användas
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // Content Security Policy – tillåter bara resurser från kända källor
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js inline-scripts och Supabase Auth behöver unsafe-inline/unsafe-eval
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Supabase storage för bilder/videor
      "img-src 'self' data: blob: https://*.supabase.co",
      "media-src 'self' blob: https://*.supabase.co",
      // Supabase API + Resend (e-post skickas server-side, behövs ej här)
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
      "frame-src 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Applicera säkerhetsheaders på alla routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
