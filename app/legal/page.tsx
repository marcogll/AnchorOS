export default function LegalPage() {
  return (
    <div className="section">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de Términos</h2>
            <p className="text-gray-600 mb-4">
              Al utilizar los servicios de Anchor:23, aceptas estos términos y condiciones.
              Si no estás de acuerdo con alguno de estos términos, por favor no utilices
              nuestros servicios.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Servicios Prestados</h2>
            <p className="text-gray-600 mb-4">
              Anchor:23 proporciona servicios de belleza y bienestar de alta gama,
              incluyendo pero no limitado a:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Spa de Alta Gama</li>
              <li>Arte y Manicure de Precisión</li>
              <li>Peinado y Maquillaje de Lujo</li>
              <li>Cuidado Corporal</li>
              <li>Membresías Exclusivas</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Reservas y Cancelaciones</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reservas</h3>
                <p className="text-gray-600">
                  Las reservas se pueden realizar a través de nuestro sitio web
                  booking.anchor23.mx o por teléfono. Se requiere confirmación con
                  al menos 24 horas de anticipación.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancelaciones</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Cancelaciones con más de 24h de anticipación: sin costo</li>
                  <li>Cancelaciones con menos de 24h: 50% del servicio</li>
                  <li>No-show: 100% del servicio</li>
                  <li>Las membresías VIP tienen políticas más flexibles</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Pagos</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Aceptamos efectivo, tarjetas de crédito/débito y transferencias</li>
              <li>Los precios incluyen IVA</li>
              <li>Las membresías se cobran mensualmente</li>
              <li>No realizamos reembolsos por servicios parcialmente utilizados</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Membresías</h2>
            <p className="text-gray-600 mb-4">
              Las membresías de Anchor:23 otorgan acceso prioritario y beneficios
              exclusivos:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Gold Tier: Acceso prioritario, descuentos selectos</li>
              <li>Black Tier: Privilegios premium, atención personalizada</li>
              <li>VIP Tier: Experiencias ilimitadas, acceso exclusivo</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Las membresías se renuevan automáticamente. Para cancelar, notificar
              con 30 días de anticipación.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Conducta del Cliente</h2>
            <p className="text-gray-600 mb-4">
              Esperamos un comportamiento respetuoso y profesional de todos nuestros
              clientes. Nos reservamos el derecho de denegar servicio o cancelar
              membresías por:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Comportamiento agresivo o ofensivo</li>
              <li>Violación de políticas de salud y seguridad</li>
              <li>No pago de servicios</li>
              <li>Faltas recurrentes sin notificación</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propiedad Intelectual</h2>
            <p className="text-gray-600">
              Todo el contenido, diseño, marcas y materiales en este sitio y
              relacionadas con Anchor:23 son propiedad exclusiva de la empresa.
              No se permite la reproducción sin autorización expresa.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitación de Responsabilidad</h2>
            <p className="text-gray-600 mb-4">
              Anchor:23 no se hace responsable por:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Daños personales derivados de negligencia del cliente</li>
              <li>Pérdida de objetos personales</li>
              <li>Reacciones alérgicas a productos (previo aviso de alergias)</li>
              <li>Interrupciones de servicio por fuerza mayor</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificaciones</h2>
            <p className="text-gray-600">
              Nos reservamos el derecho de modificar estos términos y condiciones en
              cualquier momento. Los cambios entrarán en vigor al publicarse en este
              sitio.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Jurisdicción</h2>
            <p className="text-gray-600">
              Estos términos y condiciones se rigen por las leyes de México.
              Cualquier disputa será resuelta en los tribunales de Saltillo,
              Coahuila, México.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
            <p className="text-gray-600 mb-4">
              Para preguntas sobre estos términos y condiciones, contáctenos:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>Email: legal@anchor23.mx</p>
              <p>Teléfono: +52 844 123 4567</p>
              <p>Dirección: Saltillo, Coahuila, México</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
