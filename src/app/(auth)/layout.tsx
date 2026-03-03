import Link from 'next/link'
import { Megaphone } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 group-hover:bg-white/25 transition-colors">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Reklamsidan</span>
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
