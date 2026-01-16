export default function ServiciosPage() {
  const services = [
    {
      category: 'Spa de Alta Gama',
      description: 'Sauna y spa excepcionales, diseñados para el rejuvenecimiento y el equilibrio.',
      items: ['Tratamientos Faciales', 'Masajes Terapéuticos', 'Hidroterapia']
    },
    {
      category: 'Arte y Manicure de Precisión',
      description: 'Estilización y técnica donde el detalle define el resultado.',
      items: ['Manicure de Precisión', 'Pedicure Spa', 'Arte en Uñas']
    },
    {
      category: 'Peinado y Maquillaje de Lujo',
      description: 'Transformaciones discretas y sofisticadas para ocasiones selectas.',
      items: ['Corte y Estilismo', 'Color Premium', 'Maquillaje Profesional']
    },
    {
      category: 'Cuidado Corporal',
      description: 'Ritual de bienestar integral.',
      items: ['Exfoliación Profunda', 'Envolturas Corporales', 'Tratamientos Reductores']
    },
    {
      category: 'Membresías Exclusivas',
      description: 'Acceso prioritario y experiencias personalizadas.',
      items: ['Gold Tier', 'Black Tier', 'VIP Tier']
    }
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h1 className="section-title">Nuestros Servicios</h1>
        <p className="section-subtitle">
          Experiencias diseñadas con precisión y elegancia para clientes que valoran la exclusividad.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <article key={index} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">{service.category}</h2>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="space-y-2">
                {service.items.map((item, idx) => (
                  <li key={idx} className="flex items-center text-gray-700">
                    <span className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="https://booking.anchor23.mx" className="btn-primary">
            Reservar Cita
          </a>
        </div>
      </div>
    </div>
  )
}
