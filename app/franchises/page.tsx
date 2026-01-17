'use client'

import { useState } from 'react'
import { Building2, Map, CheckCircle, Mail, Phone } from 'lucide-react'

/** @description Franchise information and application page component for potential franchise partners. */
export default function FranchisesPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    experiencia: '',
    mensaje: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const benefits = [
    'Modelo de negocio exclusivo y probado',
    'Una sucursal por ciudad: saturación controlada',
    'Sistema operativo completo (AnchorOS)',
    'Capacitación en estándares de lujo',
    'Membresía de clientes como fuente recurrente',
    'Soporte continuo y actualizaciones'
  ]

  const requirements = [
    'Compromiso inquebrantable con la calidad',
    'Experiencia en industria de belleza',
    'Inversión mínima: $500,000 USD',
    'Ubicación premium en ciudad de interés',
    'Capacidad de contratar personal calificado'
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h1 className="section-title">Franquicias</h1>
        <p className="section-subtitle">
          Una oportunidad para llevar el estándar Anchor:23 a tu ciudad.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Nuestro Modelo</h2>
          
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-12 border border-gray-100">
            <div className="flex items-center justify-center mb-8">
              <Building2 className="w-16 h-16 text-gray-900" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Una Sucursal por Ciudad
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed text-center mb-8">
              A diferencia de modelos masivos, creemos en la exclusividad geográfica.
              Cada ciudad tiene una sola ubicación Anchor:23, garantizando calidad
              consistente y demanda sostenible.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6">
                <Map className="w-12 h-12 mx-auto mb-4 text-gray-900" />
                <h4 className="font-semibold text-gray-900 mb-2">Exclusividad</h4>
                <p className="text-gray-600 text-sm">Sin competencia interna</p>
              </div>
              <div className="p-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-900" />
                <h4 className="font-semibold text-gray-900 mb-2">Calidad</h4>
                <p className="text-gray-600 text-sm">Estándar uniforme</p>
              </div>
              <div className="p-6">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-900" />
                <h4 className="font-semibold text-gray-900 mb-2">Sostenibilidad</h4>
                <p className="text-gray-600 text-sm">Demanda controlada</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Beneficios</h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Requisitos</h2>
              <div className="space-y-4">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">{req}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Solicitud de Información
          </h2>

          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="p-8 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-12 h-12 text-green-900 mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Solicitud Enviada
                </h3>
                <p className="text-green-800">
                  Gracias por tu interés. Revisaremos tu perfil y te contactaremos
                  pronto para discutir las oportunidades disponibles.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
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
                      placeholder="Tu nombre"
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
                    <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Interés
                    </label>
                    <input
                      type="text"
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Ej. Monterrey, Guadalajara"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="experiencia" className="block text-sm font-medium text-gray-700 mb-2">
                    Experiencia en el Sector
                  </label>
                  <select
                    id="experiencia"
                    name="experiencia"
                    value={formData.experiencia}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="sin-experiencia">Sin experiencia</option>
                    <option value="1-3-anos">1-3 años</option>
                    <option value="3-5-anos">3-5 años</option>
                    <option value="5-10-anos">5-10 años</option>
                    <option value="mas-10-anos">Más de 10 años</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje Adicional
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Cuéntanos sobre tu interés o preguntas"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  Enviar Solicitud
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">
              ¿Tienes Preguntas Directas?
            </h3>
            <p className="text-gray-300 mb-8 text-center">
              Nuestro equipo de franquicias está disponible para resolver tus dudas.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6" />
                <span>franchises@anchor23.mx</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-6 h-6" />
                <span>+52 844 987 6543</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
