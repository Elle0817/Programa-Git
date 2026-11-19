"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const $ = s => document.querySelector(s);
    const form = $("#filtros-reportes");

    function localYMD(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") +
            "-" + String(date.getDate()).padStart(2, "0");
    }

    function cell(value) {
        const td = document.createElement("td");
        td.textContent = value == null ? "—" : String(value);
        return td;
    }

    function empty(body, colspan, text) {
        const tr = document.createElement("tr");
        const td = cell(text);
        td.colSpan = colspan;
        tr.append(td);
        body.replaceChildren(tr);
    }

    function renderRows(body, rows, headers, map, formatEmpty) {
        body.replaceChildren();
        if (!rows.length) return empty(body, headers, formatEmpty);
        rows.forEach(row => {
            const tr = document.createElement("tr");
            map(row).forEach(value => tr.append(cell(value)));
            body.append(tr);
        });
    }

    async function cargar() {
        const desde = $("#reporte-desde").value;
        const hasta = $("#reporte-hasta").value;
        if (!desde || !hasta || desde > hasta) {
            MGT.mostrarMensaje("Selecciona un periodo válido.", "error");
            return;
        }
        try {
            await MGT.negocioActivo();
            const data = await MGT.request("/api/reportes/resumen" + MGT.query({ desde, hasta }));
            $("#rpt-clientes").textContent = data.clientesRegistrados;
            $("#rpt-servicios").textContent = data.serviciosPublicados;
            $("#rpt-costos").textContent = MGT.dinero(data.costosTotales);
            $("#rpt-ingresos").textContent = data.ingresosDisponibles
                ? MGT.dinero(data.ingresos) : "No disponibles";

            renderRows($("#rpt-estados"), data.reservasPorEstado, 2,
                r => [r.estado, r.cantidad], "Sin reservas en el periodo.");
            renderRows($("#rpt-servicios-top"), data.serviciosMasReservados, 2,
                r => [r.nombre, r.reservas], "Sin reservas en el periodo.");
            renderRows($("#rpt-costos-categorias"), data.costosPorCategoria, 2,
                r => [r.categoria, MGT.dinero(r.total)], "Sin costos en el periodo.");

            const costs = new Map(data.evolucionCostos.map(x => [x.periodo, x.total]));
            const bookings = new Map(data.evolucionReservas.map(x => [x.periodo, x.cantidad]));
            const months = [...new Set([...costs.keys(), ...bookings.keys()])].sort();
            renderRows($("#rpt-evolucion"), months, 3,
                month => [month, bookings.get(month) || 0,
                    MGT.dinero(costs.get(month) || 0)], "Sin datos de evolución en el periodo.");
            MGT.mostrarMensaje("");
        } catch (error) {
            for (const id of ["rpt-estados", "rpt-servicios-top", "rpt-costos-categorias", "rpt-evolucion"]) {
                empty(document.getElementById(id), id === "rpt-evolucion" ? 3 : 2,
                    "No fue posible cargar este reporte.");
            }
            MGT.mostrarMensaje(error.message, "error");
        }
    }

    const today = new Date();
    $("#reporte-hasta").value = localYMD(today);
    $("#reporte-desde").value = localYMD(new Date(today.getFullYear(), today.getMonth(), 1));
    form.addEventListener("submit", async event => { event.preventDefault(); await cargar(); });
    await cargar();
});
