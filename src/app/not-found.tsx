import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Reklamsidan" width={140} height={42} className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-8xl font-extrabold text-primary-100 select-none mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sidan hittades inte</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Sidan du letar efter finns inte eller har flyttats. Kontrollera adressen eller gå tillbaka till startsidan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition"
        >
          Till startsidan
        </Link>
      </div>
    </div>
  )
}
