'use client'

import { useState, useEffect } from 'react'
import { AnimatedLogo } from '@/components/animated-logo'
import { RollingPhrases } from '@/components/rolling-phrases'

/** @description Services page with home page style structure */

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
      core: 'CORE EXPERIENCES - El corazón de Anchor 23',
      nails: 'NAIL COUTURE - Técnica invisible. Resultado impecable.',
      hair: 'HAIR FINISHING RITUALS',
      lashes: 'LASH & BROW RITUALS - Mirada definida con sutileza.',
      brows: 'LASH & BROW RITUALS - Mirada definida con sutileza.',
      events: 'EVENT EXPERIENCES - Agenda especial',
      permanent: 'PERMANENT RITUALS - Agenda limitada · Especialista certificada'
    }
    return titles[category] || category
  }

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      core: 'Rituales conscientes donde el tiempo se desacelera. Cada experiencia está diseñada para mujeres que valoran el silencio, la atención absoluta y los resultados impecables.',
      nails: 'En Anchor 23 no eliges técnicas. Cada decisión se toma internamente para lograr un resultado elegante, duradero y natural. No ofrecemos servicios de mantenimiento ni correcciones.',
      hair: 'Disponibles únicamente para clientas con experiencia Anchor el mismo día.',
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
      <div className="section">
        <div className="section-header">
          <h1 className="section-title">Nuestros Servicios</h1>
          <p className="section-subtitle">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <AnimatedLogo />
          <h1>Servicios</h1>
          <h2>Anchor:23</h2>
          <RollingPhrases />
          <div className="hero-actions">
            <a href="/booking/servicios" className="btn-primary">
              Reservar Cita
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-amber-50 to-gray-50">
            <span className="text-gray-500 text-lg">Imagen Servicios</span>
          </div>
        </div>
      </section>

      <section className="foundation">
        <article>
          <h3>Experiencias</h3>
          <h4>Criterio antes que cantidad</h4>
          <p>
            Anchor 23 es un espacio privado donde el tiempo se desacelera. Aquí, cada experiencia está diseñada para mujeres que valoran el silencio, la atención absoluta y los resultados impecables.
          </p>
          <p>
            No trabajamos con volumen. Trabajamos con intención.
          </p>
        </article>
        <aside className="foundation-image">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-gray-50">
            <span className="text-gray-500 text-lg">Imagen Experiencias</span>
          </div>
        </aside>
      </section>

      <section className="services-preview">
        <h3>Nuestros Servicios</h3>
        <div className="max-w-7xl mx-auto px-6">
          {categoryOrder.map(category => {
            const categoryServices = groupedServices[category]
            if (!categoryServices || categoryServices.length === 0) return null

            return (
              <div key={category} className="service-cards mb-24">
                <div className="mb-8">
                  <h4 className="text-3xl font-bold text-gray-900 mb-4">
                    {getCategoryTitle(category)}
                  </h4>
                  {getCategoryDescription(category) && (
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {getCategoryDescription(category)}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryServices.map((service) => (
                    <article
                      key={service.id}
                      className="service-card"
                    >
                      <div className="mb-4">
                        <h5 className="text-xl font-semibold text-gray-900 mb-2">
                          {service.name}
                        </h5>
                        {service.description && (
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 text-sm">
                          ⏳ {formatDuration(service.duration_minutes)}
                        </span>
                        {service.requires_dual_artist && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Dual Artist</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(service.base_price)}
                        </span>
                        <a href="/booking/servicios" className="btn-primary">
                          Reservar
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}

          <section className="testimonials">
            <h3>Lo que Define Anchor 23</h3>
            <div className="max-w-4xl mx-auto text-center">
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">•</span>
                    <span className="text-gray-700">No ofrecemos retoques ni servicios aislados</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">•</span>
                    <span className="text-gray-700">No trabajamos con prisas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">•</span>
                    <span className="text-gray-700">No explicamos de más</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">•</span>
                    <span className="text-gray-700">No negociamos estándares</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">•</span>
                    <span className="text-gray-700">Cada experiencia está pensada para durar, sentirse y recordarse</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  )
}
