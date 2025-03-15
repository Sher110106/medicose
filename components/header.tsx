import { Home } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2"
          aria-label="Expiry Date Reader Home"
        >
          <Home className="w-6 h-6" aria-hidden="true" />
          <span>Expiry Date Reader</span>
        </Link>
      </div>
    </header>
  )
}

