import Link from 'next/link'
import { Megaphone } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 text-white hover:opacity-90">
          <Megaphone className="h-8 w-8" />
          <span className="text-2xl font-bold">Reklamsidan</span>
        </Link>
        {/* Card */}
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
          {children}
        </div>
        <p className="mt-6 text-sm text-primary-200">
          © {new Date().getFullYear()} Reklamsidan
        </p>
      </div>
    </div>
  )
}
