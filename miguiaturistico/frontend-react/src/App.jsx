import ServiceCard from './components/ServiceCard'
import './App.css'

function App() {
  const serviciosPublicados = [
    {
      nombre: 'Tour Histórico por Bogotá',
      categoria: 'Experiencia cultural',
      estado: 'Publicado'
    },
    {
      nombre: 'Ruta Gastronómica',
      categoria: 'Experiencia gastronómica',
      estado: 'Publicado'
    }
  ]

  const borradores = [
    {
      nombre: 'Tour Nocturno por La Candelaria',
      categoria: 'Experiencia nocturna',
      progreso: 70
    },
    {
      nombre: 'Experiencia Cafetera',
      categoria: 'Naturaleza y cultura',
      progreso: 45
    }
  ]

  const serviciosAdicionales = [
    {
      icono: '🍽️',
      nombre: 'Alimentación',
      descripcion: 'Desayunos, almuerzos y refrigerios'
    },
    {
      icono: '🚌',
      nombre: 'Transporte',
      descripcion: 'Traslados y transporte durante el recorrido'
    },
    {
      icono: '🏨',
      nombre: 'Alojamiento',
      descripcion: 'Hoteles, hostales y hospedajes'
    },
    {
      icono: '🎁',
      nombre: 'Recuerdos',
      descripcion: 'Souvenirs y productos locales'
    }
  ]

  return (
    <div className="admin-dashboard">

      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            PANEL DE ADMINISTRACIÓN
          </span>

          <h1>Mi Guía Turístico</h1>

          <p>
            Gestiona los servicios y experiencias de tu empresa.
          </p>
        </div>

        <button className="profile-button">
          Andes Travel
        </button>
      </header>

      <nav className="dashboard-navigation">
        <button className="nav-item active">
          Servicios
        </button>

        <button className="nav-item">
          Reservas
        </button>

        <button className="nav-item">
          Clientes
        </button>

        <button className="nav-item">
          Costos
        </button>
      </nav>

      <section className="dashboard-summary">

        <div className="summary-card">
          <span>Servicios activos</span>
          <strong>8</strong>
          <small>+2 este mes</small>
        </div>

        <div className="summary-card">
          <span>Reservas pendientes</span>
          <strong>24</strong>
          <small>Requieren atención</small>
        </div>

        <div className="summary-card">
          <span>Calificación promedio</span>
          <strong>4.8 ★</strong>
          <small>Excelente desempeño</small>
        </div>

        <div className="summary-card">
          <span>Borradores</span>
          <strong>{borradores.length}</strong>
          <small>Listos para continuar</small>
        </div>

      </section>

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              CATÁLOGO
            </span>

            <h2>Servicios publicados</h2>
          </div>

          <button className="create-button">
            + Nuevo servicio
          </button>
        </div>

        <div className="service-grid">
          {serviciosPublicados.map((servicio, index) => (
            <ServiceCard
              key={index}
              nombre={servicio.nombre}
              categoria={servicio.categoria}
              estado={servicio.estado}
            />
          ))}
        </div>

      </section>

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              EN PROCESO
            </span>

            <h2>Borradores</h2>
          </div>
        </div>

        <div className="draft-grid">

          {borradores.map((borrador, index) => (
            <article className="draft-card" key={index}>

              <div className="draft-icon">
                ✦
              </div>

              <div className="draft-content">
                <span>{borrador.categoria}</span>

                <h3>{borrador.nombre}</h3>

                <div className="progress-info">
                  <small>
                    {borrador.progreso}% completado
                  </small>

                  <strong>
                    {borrador.progreso}%
                  </strong>
                </div>

                <div className="progress-bar">
                  <div
                    style={{
                      width: `${borrador.progreso}%`
                    }}
                  ></div>
                </div>

                <button className="draft-button">
                  Continuar edición →
                </button>
              </div>

            </article>
          ))}

        </div>

      </section>

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              OPCIONALES
            </span>

            <h2>Servicios adicionales</h2>
          </div>

          <button className="create-button">
            + Agregar servicio
          </button>
        </div>

        <div className="additional-grid">

          {serviciosAdicionales.map((servicio, index) => (
            <article
              className="additional-card"
              key={index}
            >

              <div className="additional-icon">
                {servicio.icono}
              </div>

              <div>
                <h3>{servicio.nombre}</h3>

                <p>
                  {servicio.descripcion}
                </p>
              </div>

              <button>
                +
              </button>

            </article>
          ))}

        </div>

      </section>

    </div>
  )
}

export default App