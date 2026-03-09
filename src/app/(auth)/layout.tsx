import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center group">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
            <Image
              src="/logo.png"
              alt="wecq Reklamsidan"
              width={240}
              height={72}
              className="h-14 w-auto"
              priority
            />
          </div>
        </Link>
        {/* Card */}
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          {children}
        </div>
        <p className="mt-8 text-sm text-primary-300/70">
          © {new Date().getFullYear()} Reklamsidan
        </p>
      </div>
    </div>
  )
}
