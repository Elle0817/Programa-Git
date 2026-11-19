"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const $ = selector => document.querySelector(selector);
    let mes = new Date();
    mes = new Date(mes.getFullYear(), mes.getMonth(), 1);
    let reservas = [];
    let proximas = [];
    let actividades = [];
    let seleccionada = null;
    let actividadActual = null;

    function localYMD(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") +
            "-" + String(date.getDate()).padStart(2, "0");
    }

    function crearCelda(texto) {
        const cell = document.createElement("td");
        cell.textContent = texto == null || texto === "" ? "—" : String(texto);
        return cell;
    }

    function filaVacia(body, columns, text) {
        const row = document.createElement("tr");
        const cell = crearCelda(text);
        cell.colSpan = columns;
        row.append(cell);
        body.replaceChildren(row);
    }

    async function cargar() {
        const body = $("#calendario-cuerpo");
        try {
            await MGT.negocioActivo();
            const desde = localYMD(mes);
            const hastaDate = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
            const hasta = localYMD(hastaDate);
            const estado = $("#cal-filtro-estado").value;
            const desdeProximas = localYMD(new Date());
            const hastaProximas = localYMD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            const [periodo, siguientes, eventos] = await Promise.all([
                MGT.request("/api/reservas" + MGT.query({ desde, hasta, estado })),
                MGT.request("/api/reservas" + MGT.query({ desde: desdeProximas, hasta: hastaProximas })),
                MGT.request("/api/actividades" + MGT.query({ desde, hasta }))
            ]);
            reservas = periodo;
            proximas = siguientes;
            actividades = eventos;
            $("#calendario-titulo").textContent = mes.toLocaleDateString("es-CO", {
                month: "long", year: "numeric"
            });
            $("#calendario-caption").textContent = "Calendario de " + mes.toLocaleDateString("es-CO", {
                month: "long", year: "numeric"
            });
            renderCalendario();
            renderListaReservas();
            renderListaActividades();
            indicadores();
            MGT.mostrarMensaje("");
        } catch (error) {
            filaVacia(body, 7, "No fue posible cargar el calendario.");
            filaVacia($("#calendario-lista"), 7, "No fue posible cargar las reservas.");
            filaVacia($("#actividades-lista"), 5, "No fue posible cargar las actividades.");
            MGT.mostrarMensaje(error.message, "error");
        }
    }

    function agregarReserva(td, reserva) {
        const link = document.createElement("a");
        link.className = "evento-calendario estado-" + String(reserva.estado).toLowerCase();
        link.href = "reservas.html?detalle=" + encodeURIComponent(reserva.idReserva);
        link.textContent = `Reserva ${reserva.fechaReserva.slice(11, 16)} · ${reserva.codigo}`;
        link.title = `${reserva.nombreCliente} · ${reserva.nombreServicio} · ${reserva.cantidadPersonas} personas · ${reserva.estado}`;
        td.append(link);
    }

    function agregarActividad(td, actividad) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "evento-calendario evento-actividad estado-" + String(actividad.estado).toLowerCase();
        button.textContent = `${actividad.tipo} ${actividad.fechaInicio.slice(11, 16)} · ${actividad.titulo}`;
        button.title = `${actividad.tipo} · ${actividad.estado}`;
        button.addEventListener("click", () => verActividad(actividad.idActividad));
        td.append(button);
    }

    function renderCalendario() {
        const body = $("#calendario-cuerpo");
        body.replaceChildren();
        const first = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7;
        const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
        const reservasDia = new Map();
        const actividadesDia = new Map();
        reservas.forEach(item => {
            const key = item.fechaReserva.slice(0, 10);
            if (!reservasDia.has(key)) reservasDia.set(key, []);
            reservasDia.get(key).push(item);
        });
        actividades.forEach(item => {
            const key = item.fechaInicio.slice(0, 10);
            if (!actividadesDia.has(key)) actividadesDia.set(key, []);
            actividadesDia.get(key).push(item);
        });
        for (let week = 0; week < 6; week++) {
            const row = document.createElement("tr");
            for (let day = 0; day < 7; day++) {
                const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day);
                const key = localYMD(date);
                const cell = document.createElement("td");
                if (date.getMonth() !== mes.getMonth()) cell.classList.add("dia-otro-mes");
                if (key === seleccionada) cell.classList.add("dia-seleccionado");
                const choose = document.createElement("button");
                choose.type = "button";
                choose.className = "dia-calendario";
                choose.textContent = String(date.getDate());
                choose.setAttribute("aria-label", `Crear actividad el ${key}`);
                choose.addEventListener("click", () => seleccionarDia(key));
                cell.append(choose);
                (reservasDia.get(key) || []).forEach(item => agregarReserva(cell, item));
                (actividadesDia.get(key) || []).forEach(item => agregarActividad(cell, item));
                row.append(cell);
            }
            body.append(row);
        }
        $("#fecha-seleccionada-calendario").textContent = seleccionada
            ? `Día seleccionado: ${MGT.fecha(seleccionada)}` : "Selecciona un día para crear una actividad.";
    }

    function renderListaReservas() {
        const body = $("#calendario-lista");
        body.replaceChildren();
        if (!reservas.length) return filaVacia(body, 7, "No hay reservas en este periodo.");
        reservas.forEach(item => {
            const row = document.createElement("tr");
            [MGT.fechaHora(item.fechaReserva), item.codigo, item.nombreCliente,
                item.nombreServicio, item.cantidadPersonas, item.estado].forEach(value => row.append(crearCelda(value)));
            const cell = document.createElement("td");
            const link = document.createElement("a");
            link.href = "reservas.html?detalle=" + encodeURIComponent(item.idReserva);
            link.textContent = "Abrir reserva";
            cell.append(link);
            row.append(cell);
            body.append(row);
        });
    }

    function renderListaActividades() {
        const body = $("#actividades-lista");
        body.replaceChildren();
        if (!actividades.length) return filaVacia(body, 5, "No hay actividades en este periodo.");
        actividades.forEach(item => {
            const row = document.createElement("tr");
            [MGT.fechaHora(item.fechaInicio), item.titulo, item.tipo, item.estado].forEach(value => row.append(crearCelda(value)));
            const cell = document.createElement("td");
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Ver actividad";
            button.addEventListener("click", () => verActividad(item.idActividad));
            cell.append(button);
            row.append(cell);
            body.append(row);
        });
    }

    function indicadores() {
        $("#cal-total").textContent = String(reservas.length);
        $("#cal-actividades").textContent = String(actividades.length);
        $("#cal-pendientes").textContent = String(reservas.filter(item => item.estado === "Pendiente").length);
        $("#cal-proximas").textContent = String(proximas.filter(item => item.estado !== "Cancelada").length);
    }

    async function seleccionarDia(key) {
        seleccionada = key;
        const date = new Date(key + "T12:00:00");
        if (date.getMonth() !== mes.getMonth() || date.getFullYear() !== mes.getFullYear()) {
            mes = new Date(date.getFullYear(), date.getMonth(), 1);
            await cargar();
        } else {
            renderCalendario();
        }
        abrirFormulario(null, key);
    }

    function abrirFormulario(item = null, dia = seleccionada || localYMD(new Date())) {
        const form = $("#formulario-actividad");
        form.reset();
        form.elements.idActividad.value = item?.idActividad || "";
        form.elements.titulo.value = item?.titulo || "";
        form.elements.descripcion.value = item?.descripcion || "";
        form.elements.fechaInicio.value = item?.fechaInicio?.slice(0, 10) || dia;
        form.elements.horaInicio.value = item?.fechaInicio?.slice(11, 16) || "";
        form.elements.fechaFin.value = item?.fechaFin?.slice(0, 10) || "";
        form.elements.horaFin.value = item?.fechaFin?.slice(11, 16) || "";
        form.elements.tipo.value = item?.tipo || "Actividad";
        form.elements.estado.value = item?.estado || "Programada";
        $("#titulo-formulario-actividad").textContent = item ? "Editar actividad" : "Crear actividad";
        $("#panel-detalle-actividad").hidden = true;
        $("#panel-formulario-actividad").hidden = false;
        $("#actividad-titulo").focus();
        $("#panel-formulario-actividad").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function verActividad(id) {
        try {
            actividadActual = await MGT.request("/api/actividades/" + encodeURIComponent(id));
            const detail = $("#detalle-actividad");
            detail.replaceChildren();
            const lines = [
                ["Tipo", actividadActual.tipo], ["Estado", actividadActual.estado],
                ["Inicio", MGT.fechaHora(actividadActual.fechaInicio)],
                ["Fin", actividadActual.fechaFin ? MGT.fechaHora(actividadActual.fechaFin) : "Sin fecha final"],
                ["Descripción", actividadActual.descripcion || "Sin descripción"]
            ];
            lines.forEach(([label, value]) => {
                const paragraph = document.createElement("p");
                const strong = document.createElement("strong");
                strong.textContent = label + ": ";
                paragraph.append(strong, document.createTextNode(String(value)));
                detail.append(paragraph);
            });
            $("#detalle-actividad-titulo").textContent = actividadActual.titulo;
            $("#panel-formulario-actividad").hidden = true;
            $("#panel-detalle-actividad").hidden = false;
            $("#panel-detalle-actividad").scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            MGT.mostrarMensaje(`No se pudo consultar la actividad: ${error.message}`, "error");
        }
    }

    function serializarFormulario(form) {
        const fechaInicio = form.elements.fechaInicio.value;
        const horaInicio = form.elements.horaInicio.value;
        const fechaFin = form.elements.fechaFin.value;
        const horaFin = form.elements.horaFin.value;
        if (Boolean(fechaFin) !== Boolean(horaFin)) {
            throw new Error("Completa tanto la fecha como la hora de finalización, o deja ambas vacías.");
        }
        const inicio = `${fechaInicio}T${horaInicio}:00`;
        const fin = fechaFin ? `${fechaFin}T${horaFin}:00` : null;
        if (fin && fin <= inicio) throw new Error("La finalización debe ser posterior al inicio.");
        return {
            titulo: form.elements.titulo.value.trim(),
            descripcion: form.elements.descripcion.value.trim() || null,
            fechaInicio: inicio,
            fechaFin: fin,
            tipo: form.elements.tipo.value,
            estado: form.elements.estado.value
        };
    }

    $("#crear-actividad").addEventListener("click", () => abrirFormulario());
    $("#mes-anterior").addEventListener("click", () => {
        mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1);
        seleccionada = null;
        cargar();
    });
    $("#mes-siguiente").addEventListener("click", () => {
        mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
        seleccionada = null;
        cargar();
    });
    $("#cal-filtro-estado").addEventListener("change", cargar);
    $("#cancelar-formulario-actividad").addEventListener("click", () => {
        $("#panel-formulario-actividad").hidden = true;
    });
    $("#cerrar-detalle-actividad").addEventListener("click", () => {
        $("#panel-detalle-actividad").hidden = true;
    });
    $("#editar-actividad").addEventListener("click", () => {
        if (actividadActual) abrirFormulario(actividadActual);
    });
    $("#eliminar-actividad").addEventListener("click", async () => {
        if (!actividadActual || !window.confirm(`¿Eliminar la actividad “${actividadActual.titulo}”?`)) return;
        try {
            await MGT.request("/api/actividades/" + encodeURIComponent(actividadActual.idActividad), { method: "DELETE" });
            $("#panel-detalle-actividad").hidden = true;
            actividadActual = null;
            await cargar();
            MGT.mostrarMensaje("Actividad eliminada.", "success");
        } catch (error) {
            MGT.mostrarMensaje(`No se pudo eliminar la actividad: ${error.message}`, "error");
        }
    });
    $("#formulario-actividad").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        let datos;
        try {
            datos = serializarFormulario(form);
            if (!datos.titulo) throw new Error("El título es obligatorio.");
        } catch (error) {
            MGT.mostrarMensaje(error.message, "error");
            return;
        }
        const id = form.elements.idActividad.value;
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            await MGT.request(id ? `/api/actividades/${encodeURIComponent(id)}` : "/api/actividades", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(datos)
            });
            $("#panel-formulario-actividad").hidden = true;
            await cargar();
            MGT.mostrarMensaje(id ? "Actividad actualizada." : "Actividad creada.", "success");
        } catch (error) {
            MGT.mostrarMensaje(`No se pudo guardar la actividad: ${error.message}`, "error");
        } finally {
            submit.disabled = false;
        }
    });

    await cargar();
});
