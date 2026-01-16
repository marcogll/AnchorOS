import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ANCHOR:23 — Belleza Anclada en Exclusividad',
  description: 'Salón de ultra lujo. Un estándar exclusivo de precisión y elegancia.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <header className="site-header">
          <nav className="nav-primary">
            <div className="logo">
              <a href="/">ANCHOR:23</a>
            </div>

            <ul className="nav-links">
              <li><a href="/">Inicio</a></li>
              <li><a href="/historia">Nosotros</a></li>
              <li><a href="/servicios">Servicios</a></li>
              <li><a href="/membresias">Membresías</a></li>
            </ul>

            <div className="nav-actions">
              <a className="btn-primary" href="/membresias">Solicitar Membresía</a>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="footer-brand">
            <span>ANCHOR:23</span>
            <p>Saltillo, Coahuila, México</p>
          </div>

          <div className="footer-links">
            <a href="/historia">Nosotros</a>
            <a href="/servicios">Servicios</a>
            <a href="/contacto">Contáctanos</a>
          </div>

          <div className="footer-legal">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/legal">Legal</a>
          </div>

          <div className="footer-contact">
            <span>+52 844 123 4567</span>
            <span>contacto@anchor23.mx</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
