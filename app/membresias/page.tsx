'use client'

import { useState } from 'react'
import { Crown, Star, Award, Diamond } from 'lucide-react'

/** @description Membership tiers page component displaying exclusive membership options and application forms. */
export default function MembresiasPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const tiers = [
    {
      id: 'gold',
      name: 'Gold Tier',
      icon: Star,
      description: 'Acceso prioritario y experiencias exclusivas.',
      price: '$2,500 MXN',
      period: '/mes',
      benefits: [
        'Reserva prioritaria',
        '15% descuento en servicios',
        'Acceso anticipado a eventos',
        'Consultas de belleza mensuales',
        'Producto de cortesía mensual'
      ]
    },
    {
      id: 'black',
      name: 'Black Tier',
      icon: Award,
      description: 'Privilegios premium y atención personalizada.',
      price: '$5,000 MXN',
      period: '/mes',
      benefits: [
        'Reserva prioritaria + sin espera',
        '25% descuento en servicios',
        'Acceso VIP a eventos exclusivos',
        '2 tratamientos spa complementarios/mes',
        'Set de productos premium trimestral'
      ]
    },
    {
      id: 'vip',
      name: 'VIP Tier',
      icon: Crown,
      description: 'La máxima expresión de exclusividad.',
      price: '$10,000 MXN',
      period: '/mes',
      featured: true,
      benefits: [
        'Acceso inmediato - sin restricciones',
        '35% descuento en servicios + productos',
        'Experiencias personalizadas ilimitadas',
        'Estilista asignado exclusivamente',
        'Evento privado anual para ti + 5 invitados',
        'Acceso a instalaciones fuera de horario'
      ]
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleApply = (tierId: string) => {
    setSelectedTier(tierId)
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="section">
      <div className="section-header">
        <h1 className="section-title">Membresías Exclusivas</h1>
        <p className="section-subtitle">
          Acceso prioritario, privilegios únicos y experiencias personalizadas.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="text-center mb-16">
          <Diamond className="w-16 h-16 mx-auto mb-6 text-gray-900" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Experiencias a Medida
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nuestras membresías están diseñadas para clientes que valoran la exclusividad,
            la atención personalizada y el acceso prioritario.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <div
                key={tier.id}
                className={`relative p-8 rounded-2xl shadow-lg border-2 transition-all ${
                  tier.featured
                    ? 'bg-gray-900 border-gray-900 text-white transform scale-105'
                    : 'bg-white border-gray-100 hover:border-gray-900'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className={`flex items-center justify-center mb-6 ${tier.featured ? 'text-white' : 'text-gray-900'}`}>
                  <Icon className="w-12 h-12" />
                </div>

                <h3 className={`text-2xl font-bold mb-2 ${tier.featured ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h3>

                <p className={`mb-6 ${tier.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                  {tier.description}
                </p>

                <div className="mb-8">
                  <div className={`text-4xl font-bold mb-1 ${tier.featured ? 'text-white' : 'text-gray-900'}`}>
                    {tier.price}
                  </div>
                  <div className={`text-sm ${tier.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                    {tier.period}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className={`mr-2 mt-1 ${tier.featured ? 'text-white' : 'text-gray-900'}`}>
                        ✓
                      </span>
                      <span className={tier.featured ? 'text-gray-200' : 'text-gray-700'}>
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleApply(tier.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    tier.featured
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Solicitar {tier.name}
                </button>
              </div>
            )
          })}
        </div>

        <div id="application-form" className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Solicitud de Membresía
          </h2>

          {submitted ? (
            <div className="p-8 bg-green-50 border border-green-200 rounded-xl">
              <Award className="w-12 h-12 text-green-900 mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                Solicitud Recibida
              </h3>
              <p className="text-green-800">
                Gracias por tu interés. Nuestro equipo revisará tu solicitud y te
                contactará pronto para completar el proceso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              {selectedTier && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                  <span className="font-semibold text-gray-900">
                    Membresía Seleccionada: {tiers.find(t => t.id === selectedTier)?.name}
                  </span>
                </div>
              )}

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="+52 844 123 4567"
                />
              </div>

              <div>
                <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje Adicional (Opcional)
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  placeholder="¿Tienes alguna pregunta específica?"
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Enviar Solicitud
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          ¿Tienes Preguntas?
        </h3>
        <p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
          Nuestro equipo de atención a miembros está disponible para resolver tus dudas
          y ayudarte a encontrar la membresía perfecta para ti.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <a href="mailto:membresias@anchor23.mx" className="text-white hover:text-gray-200">
            membresias@anchor23.mx
          </a>
          <span className="text-gray-600">|</span>
          <a href="tel:+528441234567" className="text-white hover:text-gray-200">
            +52 844 123 4567
          </a>
        </div>
      </div>
    </div>
  )
}
