'use client'

import { useState, useEffect } from 'react'
import { AnimatedLogo } from '@/components/animated-logo'
import { RollingPhrases } from '@/components/rolling-phrases'

/** @description Premium services page with elegant layout and sophisticated design */

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  base_price: number
  category: string
  requires_dual_artist: boolean
  is_active: boolean
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      if (data.success) {
        setServices(data.services.filter((s: Service) => s.is_active))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${mins} min`
  }

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      core: 'CORE EXPERIENCES',
      nails: 'NAIL COUTURE',
      hair: 'HAIR FINISHING RITUALS',
      lashes: 'LASH & BROW RITUALS',
      brows: 'LASH & BROW RITUALS',
      events: 'EVENT EXPERIENCES',
      permanent: 'PERMANENT RITUALS'
    }
    return titles[category] || category
  }

  const getCategorySubtitle = (category: string) => {
    const subtitles: Record<string, string> = {
      core: 'El corazón de Anchor 23',
      nails: 'Técnica invisible. Resultado impecable.',
      hair: 'Disponibles únicamente para clientas con experiencia Anchor el mismo día',
      lashes: 'Mirada definida con sutileza',
      brows: 'Mirada definida con sutileza',
      events: 'Agenda especial',
      permanent: 'Agenda limitada · Especialista certificada'
    }
    return subtitles[category] || ''
  }

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      core: 'Rituales conscientes donde el tiempo se desacelera. Cada experiencia está diseñada para mujeres que valoran el silencio, la atención absoluta y los resultados impecables.',
      nails: 'En Anchor 23 no eliges técnicas. Cada decisión se toma internamente para lograr un resultado elegante, duradero y natural. No ofrecemos servicios de mantenimiento ni correcciones.',
      hair: '',
      lashes: '',
      brows: '',
      events: 'Agenda especial para ocasiones selectas.',
      permanent: ''
    }
    return descriptions[category] || ''
  }

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  const categoryOrder = ['core', 'nails', 'hair', 'lashes', 'brows', 'events', 'permanent']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal-brown mb-4"></div>
          <p className="text-xl text-charcoal-brown opacity-70">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section - Simplified and Elegant */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(111, 94, 79, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
          <div className="mb-8">
            <AnimatedLogo />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
            Nuestros Servicios
          </h1>
          <div className="mb-10">
            <RollingPhrases />
          </div>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-80" style={{ color: 'var(--charcoal-brown)' }}>
            Experiencias diseñadas para mujeres que valoran el silencio, la atención absoluta y los resultados impecables.
          </p>
          <div className="flex items-center justify-center gap-6">
            <a href="/booking/servicios" className="btn-primary text-base px-10 py-4">
              Reservar Experiencia
            </a>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 relative" style={{ background: 'var(--soft-cream)' }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-4 opacity-60" style={{ color: 'var(--deep-earth)' }}>
                Nuestra Filosofía
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
                Criterio antes que cantidad
              </h2>
              <p className="text-lg leading-relaxed mb-6 opacity-85" style={{ color: 'var(--charcoal-brown)' }}>
                Anchor 23 es un espacio privado donde el tiempo se desacelera. Aquí, cada experiencia está diseñada para mujeres que valoran el silencio, la atención absoluta y los resultados impecables.
              </p>
              <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--deep-earth)' }}>
                No trabajamos con volumen. Trabajamos con intención.
              </p>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 via-stone-100 to-neutral-100">
                <span className="text-neutral-400 text-lg font-light">Imagen Experiencias</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Catalog */}
      <section className="py-32" style={{ background: 'var(--bone-white)' }}>
        <div className="max-w-7xl mx-auto px-8">
          {categoryOrder.map(category => {
            const categoryServices = groupedServices[category]
            if (!categoryServices || categoryServices.length === 0) return null

            return (
              <div key={category} className="mb-32 last:mb-0">
                {/* Category Header */}
                <div className="mb-16 text-center max-w-4xl mx-auto">
                  <p className="text-sm font-semibold tracking-widest uppercase mb-3 opacity-60" style={{ color: 'var(--deep-earth)' }}>
                    {getCategorySubtitle(category)}
                  </p>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
                    {getCategoryTitle(category)}
                  </h3>
                  {getCategoryDescription(category) && (
                    <p className="text-lg leading-relaxed opacity-75" style={{ color: 'var(--charcoal-brown)' }}>
                      {getCategoryDescription(category)}
                    </p>
                  )}
                </div>

                {/* Service Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryServices.map((service) => (
                    <article
                      key={service.id}
                      className="group relative rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                      style={{ 
                        background: 'var(--soft-cream)',
                        border: '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--mocha-taupe)'
                        e.currentTarget.style.background = 'var(--bone-white)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.background = 'var(--soft-cream)'
                      }}
                    >
                      {/* Service Header */}
                      <div className="mb-6">
                        <h4 className="text-2xl font-bold mb-3 leading-tight group-hover:opacity-90 transition-opacity" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-base leading-relaxed opacity-75" style={{ color: 'var(--charcoal-brown)' }}>
                            {service.description}
                          </p>
                        )}
                      </div>

                      {/* Service Meta */}
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--mocha-taupe)' }}>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--deep-earth)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                            {formatDuration(service.duration_minutes)}
                          </span>
                        </div>
                        {service.requires_dual_artist && (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--mocha-taupe)', color: 'var(--bone-white)' }}>
                            Dual Artist
                          </span>
                        )}
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-1 opacity-50" style={{ color: 'var(--charcoal-brown)' }}>Desde</p>
                          <p className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
                            {formatCurrency(service.base_price)}
                          </p>
                        </div>
                        <a 
                          href="/booking/servicios" 
                          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                          style={{
                            background: 'linear-gradient(135deg, var(--deep-earth), var(--charcoal-brown))',
                            color: 'var(--bone-white)'
                          }}
                        >
                          Reservar
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 relative" style={{ background: 'var(--soft-cream)' }}>
        <div className="max-w-5xl mx-auto px-8">
          <h3 className="text-4xl md:text-5xl font-bold mb-16 text-center" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
            Lo que Define Anchor 23
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                'No ofrecemos retoques ni servicios aislados',
                'No trabajamos con prisas',
                'No explicamos de más'
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 rounded-xl transition-all duration-300 hover:shadow-lg" style={{ background: 'var(--bone-white)' }}>
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: 'var(--brick-red)' }}></div>
                  <p className="text-lg leading-relaxed" style={{ color: 'var(--charcoal-brown)' }}>{text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[
                'No negociamos estándares',
                'Cada experiencia está pensada para durar, sentirse y recordarse'
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 rounded-xl transition-all duration-300 hover:shadow-lg" style={{ background: 'var(--bone-white)' }}>
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: 'var(--brick-red)' }}></div>
                  <p className="text-lg leading-relaxed" style={{ color: 'var(--charcoal-brown)' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center" style={{ background: 'var(--bone-white)' }}>
        <div className="max-w-3xl mx-auto px-8">
          <h3 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-brown)' }}>
            ¿Lista para tu experiencia?
          </h3>
          <p className="text-xl mb-10 opacity-75" style={{ color: 'var(--charcoal-brown)' }}>
            Reserva tu cita y descubre lo que significa una atención verdaderamente personalizada.
          </p>
          <a href="/booking/servicios" className="btn-primary text-base px-12 py-4 inline-block">
            Reservar Ahora
          </a>
        </div>
      </section>
    </>
  )
}
