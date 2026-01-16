import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, User } from 'lucide-react'

export default function BookingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <header className="site-header booking-header">
        <nav className="nav-primary">
          <div className="logo">
            <Link href="/">
              <span className="text-xl font-semibold" style={{ color: 'var(--charcoal-brown)' }}>
                ANCHOR:23
              </span>
            </Link>
          </div>

          <div className="nav-actions flex items-center gap-4">
            <Link href="/mis-citas">
              <Button variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Mis Citas
              </Button>
            </Link>
            <Link href="/perfil">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        {children}
      </main>
    </>
  )
}
