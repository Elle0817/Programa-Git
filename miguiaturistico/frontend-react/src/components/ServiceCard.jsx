import './ServiceCard.css'

function ServiceCard({
  nombre = 'Tour Histórico por Bogotá',
  categoria = 'Experiencia cultural',
  estado = 'Publicado'
}) {
  const servicio = {
    empresa: 'Andes Travel',
    logo: 'AT',
    nombre,
    categoria,
    descripcion:
      'Recorrido guiado por lugares históricos y culturales de la ciudad.',
    guia: 'Carlos Rodríguez',
    duracion: '4 horas',
    cupos: 8,
    precio: '$120.000',
    estado,
    puntuacionServicio: 4.9,
    puntuacionRecorrido: 4.8
  }

  const registrarUsuario = () => {
    alert(`Reserva iniciada para: ${servicio.nombre}`)
  }

  const verRecorrido = () => {
    alert(`Mostrando detalles de: ${servicio.nombre}`)
  }

  return (
    <article className="service-card">

      <header className="service-card__company">
        <div className="company-logo">
          {servicio.logo}
        </div>

        <div>
          <span>Operado por</span>
          <strong>{servicio.empresa}</strong>
        </div>

        <span className="service-status">
          ● {servicio.estado}
        </span>
      </header>

      <div className="service-card__map">

        <div className="map-label">
          RECORRIDO
        </div>

        <div className="route route-one"></div>
        <div className="route route-two"></div>

        <span className="map-point point-one"></span>
        <span className="map-point point-two"></span>
        <span className="map-point point-three"></span>

        <div className="walking-person">
          🚶
        </div>

        <span className="map-location start">
          Inicio
        </span>

        <span className="map-location finish">
          Destino
        </span>

      </div>

      <div className="service-card__content">

        <span className="service-category">
          {servicio.categoria}
        </span>

        <h2>{servicio.nombre}</h2>

        <p className="service-description">
          {servicio.descripcion}
        </p>

        <div className="ratings">

          <div className="rating">
            <span>Servicio</span>
            <strong>★ {servicio.puntuacionServicio}</strong>
          </div>

          <div className="rating">
            <span>Recorrido</span>
            <strong>★ {servicio.puntuacionRecorrido}</strong>
          </div>

        </div>

        <div className="service-info">

          <div>
            <span>Guía asignado</span>
            <strong>{servicio.guia}</strong>
          </div>

          <div>
            <span>Duración</span>
            <strong>{servicio.duracion}</strong>
          </div>

          <div>
            <span>Cupos</span>
            <strong>{servicio.cupos}</strong>
          </div>

        </div>

        <footer className="service-card__footer">

          <div className="service-price">
            <span>Desde</span>
            <strong>{servicio.precio}</strong>
            <small>por persona</small>
          </div>

          <div className="service-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={verRecorrido}
            >
              Ver recorrido
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={registrarUsuario}
            >
              Reservar
            </button>

          </div>

        </footer>

      </div>

    </article>
  )
}

export default ServiceCard