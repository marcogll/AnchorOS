export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="logo-mark">
            <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M 50 20 L 50 80 M 20 50 L 80 50" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="10" fill="currentColor" />
            </svg>
          </div>
          <h1>ANCHOR:23</h1>
          <h2>Belleza anclada en exclusividad</h2>
          <p>Un estándar exclusivo de lujo y precisión.</p>

          <div className="hero-actions">
            <a href="/servicios" className="btn-secondary">Ver servicios</a>
            <a href="https://booking.anchor23.mx" className="btn-primary">Solicitar cita</a>
          </div>
        </div>

        <div className="hero-image">
          <div className="w-full h-96 flex items-center justify-center">
            <span className="text-gray-500 text-lg">Imagen Hero</span>
          </div>
        </div>
      </section>

      <section className="foundation">
        <article>
          <h3>Fundamento</h3>
          <h4>Nada sólido nace del caos</h4>
          <p>
            Anchor:23 nace de la unión de dos creativos que creen en el lujo
            como estándar, no como promesa.
          </p>
          <p>
            Aquí, lo excepcional es norma: una experiencia exclusiva y coherente,
            diseñada para quienes entienden que el verdadero lujo está en la
            precisión, no en el exceso.
          </p>
        </article>

        <aside className="foundation-image">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500 text-lg">Imagen Fundamento</span>
          </div>
        </aside>
      </section>

      <section className="services-preview">
        <h3>Servicios Exclusivos</h3>

        <div className="service-cards">
          <article className="service-card">
            <h4>Spa de Alta Gama</h4>
            <p>Sauna y spa excepcionales, diseñados para el rejuvenecimiento y el equilibrio.</p>
          </article>

          <article className="service-card">
            <h4>Arte y Manicure de Precisión</h4>
            <p>Estilización y técnica donde el detalle define el resultado.</p>
          </article>

          <article className="service-card">
            <h4>Peinado y Maquillaje de Lujo</h4>
            <p>Transformaciones discretas y sofisticadas para ocasiones selectas.</p>
          </article>
        </div>

        <div className="flex justify-center">
          <a href="/servicios" className="btn-secondary">Ver todos los servicios</a>
        </div>
      </section>

      <section className="testimonials">
        <h3>Testimonios</h3>

        <div className="testimonial-grid">
          <article className="testimonial">
            <span className="stars">★★★★★</span>
            <p>La atención al detalle define el lujo real.</p>
            <cite>Gabriela M.</cite>
          </article>

          <article className="testimonial">
            <span className="stars">★★★★★</span>
            <p>Exclusivo sin ser pretencioso.</p>
            <cite>Lorena T.</cite>
          </article>
        </div>

        <div className="flex justify-center">
          <a href="/membresias" className="btn-primary">Solicitar Membresía</a>
        </div>
      </section>
    </>
  )
}
