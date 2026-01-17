/** @description Privacy policy page component explaining data collection, usage, and user rights. */
export default function PrivacyPolicyPage() {
  return (
    <div className="section">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Información que Recopilamos</h2>
            <p className="text-gray-600 mb-4">
              Anchor:23 recopila información personal de nuestros clientes para proporcionar
              servicios de belleza exclusiva y mejorar la experiencia general.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Información Personal</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Historial de citas y preferencias</li>
              <li>Información de pago (procesada de forma segura)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Uso de la Información</h2>
            <p className="text-gray-600 mb-4">
              Utilizamos la información recopilada para los siguientes propósitos:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Programar y confirmar citas</li>
              <li>Comunicar actualizaciones y recordatorios</li>
              <li>Personalizar experiencias de servicio</li>
              <li>Procesar pagos de manera segura</li>
              <li>Mejorar nuestros servicios y productos</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compartir de Información</h2>
            <p className="text-gray-600 mb-4">
              No vendemos, intercambiamos ni alquilamos información personal a terceros.
              Solo compartimos información en las siguientes circunstancias:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Con proveedores de servicios necesarios (procesadores de pago)</li>
              <li>Para cumplir con obligaciones legales</li>
              <li>Para proteger nuestros derechos y propiedad</li>
              <li>Con consentimiento explícito del cliente</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Seguridad de Datos</h2>
            <p className="text-gray-600 mb-4">
              Implementamos medidas de seguridad robustas para proteger la información personal:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Encriptación SSL para todas las transacciones</li>
              <li>Sistemas de autenticación seguros</li>
              <li>Acceso restringido a información personal</li>
              <li>Auditorías periódicas de seguridad</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Derechos del Usuario</h2>
            <p className="text-gray-600 mb-4">
              Los clientes tienen los siguientes derechos sobre su información personal:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Acceder a la información que tenemos sobre ellos</li>
              <li>Solicitar corrección de información inexacta</li>
              <li>Solicitar eliminación de su información</li>
              <li>Oponerse al procesamiento de su información</li>
              <li>Retirar consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies y Tecnologías Similares</h2>
            <p className="text-gray-600 mb-4">
              Utilizamos cookies para mejorar la experiencia del usuario, analizar el
              tráfico del sitio y personalizar el contenido. Los usuarios pueden configurar
              su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad
              del sitio.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cambios en la Política</h2>
            <p className="text-gray-600">
              Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento.
              Los cambios serán publicados en esta página con la fecha de actualización.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contacto</h2>
            <p className="text-gray-600 mb-4">
              Para preguntas sobre esta política de privacidad o para ejercer sus derechos
              como usuario, contáctenos:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>Email: privacidad@anchor23.mx</p>
              <p>Teléfono: +52 844 123 4567</p>
              <p>Dirección: Saltillo, Coahuila, México</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
