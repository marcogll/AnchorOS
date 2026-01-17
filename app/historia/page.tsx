/** @description Company history and philosophy page component explaining the brand's foundation and values. */
export default function HistoriaPage() {
  return (
    <div className="section">
      <div className="section-header">
        <h1 className="section-title">Nuestra Historia</h1>
        <p className="section-subtitle">
          El origen de una marca que redefine el estándar de belleza exclusiva.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <section className="foundation mb-24">
          <article>
            <h2>El Fundamento</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Nada sólido nace del caos</h3>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Anchor:23 nace de la unión de dos creativos que creen en el lujo
              como estándar, no como promesa.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              En un mundo saturado de opciones, decidimos crear algo diferente:
              un refugio donde la precisión técnica se encuentra con la elegancia
              atemporal, donde cada detalle importa y donde la exclusividad es
              inherente, no promocional.
            </p>
          </article>

          <aside className="foundation-image">
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-lg">Imagen Historia</span>
            </div>
          </aside>
        </section>

        <section className="max-w-4xl mx-auto mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">El Significado</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">ANCHOR</h3>
              <p className="text-gray-600 leading-relaxed">
                El ancla representa estabilidad, firmeza y permanencia.
                Es el símbolo de nuestro compromiso con la calidad constante
                y la excelencia sin concesiones.
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">:23</h3>
              <p className="text-gray-600 leading-relaxed">
                El dos y tres simbolizan la dualidad equilibrada: precisión
                técnica y creatividad artística, tradición e innovación,
                rigor y calidez.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Nuestra Filosofía</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Lujo como Estándar</h3>
              <p className="text-gray-600">
                No es lo extrañamente costoso, es lo excepcionalmente bien hecho.
              </p>
            </div>

            <div className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Exclusividad Inherente</h3>
              <p className="text-gray-600">
                Una sucursal por ciudad, invitación por membresía, calidad por convicción.
              </p>
            </div>

            <div className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Precisión Absoluta</h3>
              <p className="text-gray-600">
                Cada corte, cada color, cada tratamiento ejecutado con la máxima perfección técnica.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
