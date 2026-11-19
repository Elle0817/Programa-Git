"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const $ = selector => document.querySelector(selector);
    const tabla = $("#tabla-reservas");
    const formulario = $("#formulario-reserva");
    const panel = $("#panel-formulario-reserva");
    const detalles = $("#panel-detalle-reserva");
    let reservas = [];
    let clientes = [];
    let servicios = [];

    function filaVacia(texto) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 8;
        td.textContent = texto;
        tr.append(td);
        tabla.replaceChildren(tr);
    }

    async function cargarCatalogos() {
        const contexto = await MGT.negocioActivo();
        const [listaClientes, listaServicios] = await Promise.all([
            MGT.request("/api/clientes?idNegocio=" + encodeURIComponent(contexto.idNegocio)),
            MGT.request("/api/servicios?idNegocio=" + encodeURIComponent(contexto.idNegocio))
        ]);
        clientes = listaClientes;
        servicios = listaServicios.filter(s => s.estado === "Publicado");
        llenarSelect($("#reserva-cliente"), clientes, "idCliente", "nombre", "Selecciona un cliente");
        llenarSelect($("#reserva-servicio"), servicios, "idServicio", "nombre", "Selecciona un servicio");
        llenarSelect($("#filtro-cliente-reserva"), clientes, "idCliente", "nombre", "Todos");
        llenarSelect($("#filtro-servicio-reserva"), servicios, "idServicio", "nombre", "Todos");
    }

    function llenarSelect(select, rows, idField, labelField, placeholder) {
        const previous = select.value;
        select.replaceChildren(new Option(placeholder, ""));
        rows.forEach(row => select.add(new Option(row[labelField], row[idField])));
        if (rows.some(row => String(row[idField]) === previous)) select.value = previous;
    }

    function datosFiltro() {
        return {
            q: $("#buscar-reserva").value.trim(),
            estado: $("#filtro-estado-reserva").value,
            desde: $("#filtro-desde-reserva").value,
            hasta: $("#filtro-hasta-reserva").value,
            idCliente: $("#filtro-cliente-reserva").value,
            idServicio: $("#filtro-servicio-reserva").value
        };
    }

    async function cargar() {
        try {
            const [context, all] = await Promise.all([
                MGT.negocioActivo(),
                MGT.request("/api/reservas")
            ]);
            await cargarCatalogos();
            reservas = all;
            actualizarIndicadores(reservas);
            const f = datosFiltro();
            const result = await MGT.request("/api/reservas" + MGT.query(f));
            render(result);
            MGT.mostrarMensaje("");
        } catch (error) {
            filaVacia("No fue posible cargar las reservas.");
            MGT.mostrarMensaje(error.message, "error");
        }
    }

    function actualizarIndicadores(rows) {
        $("#total-reservas").textContent = rows.length;
        $("#pendientes-reservas").textContent = rows.filter(r => r.estado === "Pendiente").length;
        $("#confirmadas-reservas").textContent = rows.filter(r => r.estado === "Confirmada").length;
        $("#canceladas-reservas").textContent = rows.filter(r => r.estado === "Cancelada").length;
    }

    function render(rows) {
        tabla.replaceChildren();
        if (!rows.length) return filaVacia("No hay reservas para los filtros seleccionados.");
        rows.forEach(r => {
            const tr = document.createElement("tr");
            [r.codigo, r.nombreCliente, r.nombreServicio, MGT.fechaHora(r.fechaReserva),
                r.cantidadPersonas, MGT.dinero(r.total), r.estado].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value ?? "—";
                tr.append(td);
            });
            const actions = document.createElement("td");
            actions.append(button("Ver", () => ver(r.idReserva)));
            if (r.estado === "Pendiente") actions.append(button("Editar", () => editar(r.idReserva)));
            if (r.estado === "Pendiente") actions.append(button("Confirmar", () => estado(r, "Confirmada")));
            if (r.estado === "Confirmada") actions.append(button("Completar", () => estado(r, "Completada")));
            if (r.estado === "Pendiente" || r.estado === "Confirmada") {
                actions.append(button("Cancelar", () => cancelar(r)));
            }
            tr.append(actions);
            tabla.append(tr);
        });
        $("#resumen-reservas-lista").textContent = "Mostrando " + rows.length + " de " + reservas.length + " reservas";
    }

    function button(text, action) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.addEventListener("click", action);
        return b;
    }

    function abrir(r = null) {
        formulario.reset();
        formulario.elements.idReserva.value = r?.idReserva || "";
        formulario.elements.idCliente.value = r?.idCliente || "";
        formulario.elements.idServicio.value = r?.idServicio || "";
        formulario.elements.fechaReserva.value = r?.fechaReserva ? r.fechaReserva.slice(0, 16) : "";
        formulario.elements.cantidadPersonas.value = r?.cantidadPersonas || 1;
        formulario.elements.observaciones.value = r?.observaciones || "";
        $("#reserva-servicio").disabled = Boolean(r);
        $("#titulo-formulario-reserva").textContent = r ? "Editar reserva " + r.codigo : "Registrar reserva";
        panel.hidden = false;
        $("#reserva-cliente").focus();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function ver(id) {
        try {
            const r = await MGT.request("/api/reservas/" + encodeURIComponent(id));
            const container = $("#detalle-reserva");
            container.replaceChildren();
            [
                ["Código", r.codigo], ["Cliente", r.nombreCliente], ["Servicio", r.nombreServicio],
                ["Fecha y hora", MGT.fechaHora(r.fechaReserva)], ["Personas", r.cantidadPersonas],
                ["Precio unitario", MGT.dinero(r.precioUnitario)], ["Total", MGT.dinero(r.total)],
                ["Estado", r.estado], ["Observaciones", r.observaciones || "—"]
            ].forEach(([label, value]) => {
                const p = document.createElement("p");
                p.textContent = label + ": " + value;
                container.append(p);
            });
            detalles.hidden = false;
            detalles.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) { MGT.mostrarMensaje(error.message, "error"); }
    }

    async function editar(id) {
        try { abrir(await MGT.request("/api/reservas/" + encodeURIComponent(id))); }
        catch (error) { MGT.mostrarMensaje(error.message, "error"); }
    }

    async function estado(r, value) {
        try {
            await MGT.request("/api/reservas/" + r.idReserva + "/estado", {
                method: "PATCH", body: JSON.stringify({ estado: value })
            });
            MGT.mostrarMensaje("Estado actualizado.", "success");
            await cargar();
        } catch (error) { MGT.mostrarMensaje(error.message, "error"); }
    }

    async function cancelar(r) {
        if (!window.confirm("¿Cancelar la reserva " + r.codigo + "?")) return;
        try {
            await MGT.request("/api/reservas/" + r.idReserva + "/cancelar", { method: "PATCH" });
            MGT.mostrarMensaje("Reserva cancelada.", "success");
            await cargar();
        } catch (error) { MGT.mostrarMensaje(error.message, "error"); }
    }

    $("#crear-reserva").addEventListener("click", () => abrir());
    $("#cancelar-formulario-reserva").addEventListener("click", () => { panel.hidden = true; });
    $("#cerrar-detalle-reserva").addEventListener("click", () => { detalles.hidden = true; });
    $("#filtros-reservas").addEventListener("submit", async event => { event.preventDefault(); await cargar(); });
    $("#filtros-reservas").addEventListener("reset", () => setTimeout(cargar, 0));

    formulario.addEventListener("submit", async event => {
        event.preventDefault();
        const id = formulario.elements.idReserva.value;
        const datos = {
            idCliente: Number(formulario.elements.idCliente.value),
            idServicio: Number(formulario.elements.idServicio.value),
            fechaReserva: formulario.elements.fechaReserva.value,
            cantidadPersonas: Number(formulario.elements.cantidadPersonas.value),
            observaciones: formulario.elements.observaciones.value.trim() || null
        };
        const submit = formulario.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            await MGT.request(id ? "/api/reservas/" + encodeURIComponent(id) : "/api/reservas", {
                method: id ? "PUT" : "POST", body: JSON.stringify(datos)
            });
            panel.hidden = true;
            MGT.mostrarMensaje(id ? "Reserva actualizada." : "Reserva creada.", "success");
            await cargar();
        } catch (error) { MGT.mostrarMensaje(error.message, "error"); }
        finally { submit.disabled = false; }
    });

    await cargar();
    if (new URLSearchParams(location.search).get("crear") === "1") abrir();
    const detalleId = new URLSearchParams(location.search).get("detalle");
    if (detalleId) ver(detalleId);
});
