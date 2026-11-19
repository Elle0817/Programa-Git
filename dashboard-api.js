"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    const $ = selector => document.querySelector(selector);
    const contextoEl = $("#dashboard-contexto");
    const tabla = $("#dashboard-tabla-servicios");
    const mensaje = $("#dashboard-resultados");
    const formulario = $("#dashboard-busqueda");
    const entrada = $("#buscar-servicio");
    const paginaEl = $("#dashboard-pagina");
    const anterior = $("#dashboard-anterior");
    const siguiente = $("#dashboard-siguiente");
    const porPagina = 5;
    let servicios = [];
    let clientes = [];
    let reservas = [];
    let categorias = [];
    let pagina = 0;

    function celda(valor) {
        const td = document.createElement("td");
        td.textContent = valor == null || valor === "" ? "—" : String(valor);
        return td;
    }

    function renderServicios() {
        const inicio = pagina * porPagina;
        const visibles = servicios.slice(inicio, inicio + porPagina);
        tabla.replaceChildren();
        if (!servicios.length) {
            const row = document.createElement("tr");
            const cell = celda("No hay servicios en el catálogo del negocio activo.");
            cell.colSpan = 7;
            row.append(cell);
            tabla.append(row);
        } else {
            visibles.forEach(servicio => {
                const row = document.createElement("tr");
                [servicio.nombre,
                    categorias.find(c => Number(c.idCategoria) === Number(servicio.idCategoria))?.nombre || "Sin categoría",
                    MGT.dinero(servicio.precio),
                    servicio.duracionMinutos == null ? "No definida" : `${servicio.duracionMinutos} min`,
                    servicio.cupos, servicio.estado].forEach(value => row.append(celda(value)));
                const action = celda("");
                const link = document.createElement("a");
                link.href = "servicios.html";
                link.textContent = "Abrir catálogo";
                action.append(link);
                row.append(action);
                tabla.append(row);
            });
        }
        const totalPaginas = Math.max(1, Math.ceil(servicios.length / porPagina));
        paginaEl.textContent = `${pagina + 1} / ${totalPaginas}`;
        anterior.disabled = pagina === 0;
        siguiente.disabled = pagina + 1 >= totalPaginas;
        $("#dashboard-resumen-servicios").textContent = servicios.length
            ? `Mostrando ${inicio + 1}–${inicio + visibles.length} de ${servicios.length} servicios`
            : "0 servicios";
    }

    function renderBusqueda() {
        const texto = entrada.value.trim().toLocaleLowerCase();
        mensaje.replaceChildren();
        if (!texto) return;
        const coincidencias = [];
        const modulos = [
            ["Servicios", "servicios.html"], ["Reservas", "reservas.html"],
            ["Clientes", "clientes.html"], ["Costos", "costos.html"],
            ["Calendario", "calendario.html"], ["Reportes", "reportes.html"],
            ["Configuración", "configuracion.html"]
        ];
        modulos.filter(([nombre]) => nombre.toLocaleLowerCase().includes(texto))
            .forEach(([nombre, href]) => coincidencias.push({ nombre, href }));
        servicios.filter(s => String(s.nombre || "").toLocaleLowerCase().includes(texto))
            .forEach(s => coincidencias.push({ nombre: `Servicio: ${s.nombre}`, href: "servicios.html" }));
        clientes.filter(c => [c.nombre, c.correo, c.telefono].some(v => String(v || "").toLocaleLowerCase().includes(texto)))
            .forEach(c => coincidencias.push({ nombre: `Cliente: ${c.nombre}`, href: "clientes.html" }));
        reservas.filter(r => [r.codigo, r.nombreCliente, r.nombreServicio].some(v => String(v || "").toLocaleLowerCase().includes(texto)))
            .forEach(r => coincidencias.push({ nombre: `Reserva ${r.codigo}: ${r.nombreCliente} · ${r.nombreServicio}`, href: `reservas.html?detalle=${encodeURIComponent(r.idReserva)}` }));

        if (!coincidencias.length) {
            mensaje.textContent = "No se encontraron módulos ni registros coincidentes.";
            return;
        }
        const lista = document.createElement("ul");
        coincidencias.slice(0, 12).forEach(item => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = item.href;
            a.textContent = item.nombre;
            li.append(a);
            lista.append(li);
        });
        mensaje.append(lista);
    }

    anterior.addEventListener("click", () => { pagina--; renderServicios(); });
    siguiente.addEventListener("click", () => { pagina++; renderServicios(); });
    entrada.addEventListener("input", renderBusqueda);
    formulario.addEventListener("submit", event => { event.preventDefault(); renderBusqueda(); });
    formulario.addEventListener("reset", () => setTimeout(renderBusqueda, 0));

    try {
        const contexto = await MGT.negocioActivo();
        contextoEl.textContent = `Negocio activo #${contexto.idNegocio}`;
        const results = await Promise.allSettled([
            MGT.request(`/api/servicios?idNegocio=${encodeURIComponent(contexto.idNegocio)}`),
            MGT.request(`/api/clientes?idNegocio=${encodeURIComponent(contexto.idNegocio)}`),
            MGT.request("/api/reservas"),
            MGT.request("/api/categorias-servicios"),
            MGT.request("/api/reportes/resumen")
        ]);
        const [services, clients, bookings, categories, report] = results;
        if (services.status === "fulfilled") {
            servicios = services.value;
            $("#dashboard-servicios").textContent = String(servicios.filter(s => s.estado === "Publicado").length);
        } else $("#dashboard-servicios").textContent = "No disponible";
        if (clients.status === "fulfilled") {
            clientes = clients.value;
            $("#dashboard-clientes").textContent = String(clientes.length);
        } else $("#dashboard-clientes").textContent = "No disponible";
        if (bookings.status === "fulfilled") {
            reservas = bookings.value;
            $("#dashboard-reservas-pendientes").textContent = String(reservas.filter(r => r.estado === "Pendiente").length);
        } else $("#dashboard-reservas-pendientes").textContent = "No disponible";
        if (categories.status === "fulfilled") categorias = categories.value;
        if (report.status === "fulfilled") {
            const data = report.value;
            $("#dashboard-costos").textContent = MGT.dinero(data.costosTotales);
        } else $("#dashboard-costos").textContent = "No disponible";
        renderServicios();
    } catch (error) {
        contextoEl.textContent = `No fue posible consultar el negocio activo: ${error.message}`;
        $("#dashboard-servicios").textContent = "No disponible";
        $("#dashboard-reservas-pendientes").textContent = "No disponible";
        $("#dashboard-clientes").textContent = "No disponible";
        $("#dashboard-costos").textContent = "No disponible";
        const row = document.createElement("tr");
        const cell = celda("No fue posible cargar los servicios desde la API.");
        cell.colSpan = 7;
        row.append(cell);
        tabla.replaceChildren(row);
    }
});
