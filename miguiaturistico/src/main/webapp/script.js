// =========================
// FUNCIONES GENERALES
// =========================

const botonBuscar = document.querySelector(".search-box button");
const buscador = document.querySelector(".search-box input");

if (botonBuscar && buscador) {
  botonBuscar.addEventListener("click", function () {
    const texto = buscador.value.trim();

    if (texto === "") {
      alert("Por favor escribe un destino para buscar.");
    } else {
      alert("Buscando información sobre: " + texto);
    }
  });
}

// =========================
// MAPA INTERACTIVO - DESTINOS
// =========================

if (document.getElementById("map") && typeof L !== "undefined") {
  const map = L.map("map").setView([4.5709, -74.2973], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const lugares = [
    {
      nombre: "Cartagena de Indias",
      lat: 10.3910,
      lng: -75.4794,
      categoria: "Histórico",
      rating: "4.9",
      resena: "Ciudad amurallada con arquitectura colonial, historia caribeña y gran valor patrimonial."
    },
    {
      nombre: "Bogotá",
      lat: 4.7110,
      lng: -74.0721,
      categoria: "Cultural",
      rating: "4.6",
      resena: "Capital cultural con museos, centros históricos, gastronomía y actividades urbanas."
    },
    {
      nombre: "Medellín",
      lat: 6.2442,
      lng: -75.5812,
      categoria: "Urbano",
      rating: "4.7",
      resena: "Ciudad innovadora con oferta cultural, recorridos urbanos y espacios públicos destacados."
    },
    {
      nombre: "Parque Tayrona",
      lat: 11.3069,
      lng: -74.0664,
      categoria: "Natural",
      rating: "4.9",
      resena: "Destino natural con playas, senderos, biodiversidad y paisajes del Caribe colombiano."
    }
  ];

  lugares.forEach(function (lugar) {
    L.marker([lugar.lat, lugar.lng])
      .addTo(map)
      .bindPopup(`
        <strong>${lugar.nombre}</strong><br>
        Categoría: ${lugar.categoria}<br>
        Valoración: ⭐ ${lugar.rating}<br>
        <small>${lugar.resena}</small>
      `);
  });

  const tarjetas = document.querySelectorAll(".place-card");

  tarjetas.forEach(function (tarjeta) {
    tarjeta.addEventListener("click", function () {
      const lat = parseFloat(tarjeta.dataset.lat);
      const lng = parseFloat(tarjeta.dataset.lng);

      map.setView([lat, lng], 12);
    });
  });
}