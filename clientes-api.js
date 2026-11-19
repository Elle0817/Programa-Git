"use strict";

document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.dataset.apiClientes) return;

    const API = "/api/clientes";
    const tabla = document.querySelector("#tabla-clientes");
    const filtros = document.querySelector("#formulario-filtros-clientes");
    const buscador = document.querySelector("#buscar-cliente");
    const filtroTipo = document.querySelector("#filtro-tipo-cliente");
    const botonCrear = document.querySelector("#crear-cliente");
    const resumen = document.querySelector("#resumen-tabla-clientes");
    const mensaje = document.querySelector("#mensaje-clientes");
    const panel = document.querySelector("#panel-formulario-cliente");
    const formulario = document.querySelector("#formulario-cliente");
    const negocioActivoEl = document.querySelector("#cliente-negocio-activo");
    const indicadores = {
        total: document.querySelector("#indicador-total-clientes"),
        nuevos: document.querySelector("#indicador-clientes-nuevos"),
        frecuentes: document.querySelector("#indicador-clientes-frecuentes"),
        reservas: document.querySelector("#indicador-reservas-clientes")
    };

    if (!tabla || !filtros || !buscador || !filtroTipo || !botonCrear ||
        !panel || !formulario || !negocioActivoEl) return;

    let clientes = [];
    let cargando = false;
    let idNegocioActivo = null;

    function notificar(texto, tipo = "") {
        if (!mensaje) return;
        mensaje.textContent = texto;
        mensaje.dataset.tipo = tipo;
    }

    function celda(valor) {
        const td = document.createElement("td");
        td.textContent = valor == null || valor === "" ? "—" : String(valor);
        return td;
    }

    function boton(texto, accion) {
        const elemento = document.createElement("button");
        elemento.type = "button";
        elemento.textContent = texto;
        elemento.addEventListener("click", accion);
        return elemento;
    }

    function actualizarNegocios() {
        negocioActivoEl.textContent = idNegocioActivo == null
            ? "No disponible"
            : `#${idNegocioActivo}`;
        botonCrear.disabled = cargando || idNegocioActivo == null;
    }

    function actualizarIndicadores() {
        if (indicadores.total) indicadores.total.textContent = String(clientes.length);
        for (const clave of ["nuevos", "frecuentes", "reservas"]) {
            if (indicadores[clave]) indicadores[clave].textContent = "—";
        }
    }

    function filtrar() {
        const texto = buscador.value.trim().toLocaleLowerCase();
        const tipo = filtroTipo.value;
        let visibles = 0;
        tabla.querySelectorAll("tr[data-id]").forEach(fila => {
            const cliente = clientes.find(c => String(c.idCliente) === fila.dataset.id);
            const buscaEn = [cliente?.idCliente, cliente?.nombre, cliente?.correo, cliente?.telefono]
                .map(v => String(v ?? "")).join(" ").toLocaleLowerCase();
            const coincide = buscaEn.includes(texto) && !tipo;
            fila.hidden = !coincide;
            if (coincide) visibles++;
        });
        if (resumen) resumen.textContent = `Mostrando ${visibles} de ${clientes.length} clientes`;
    }

    function renderizar() {
        tabla.replaceChildren();
        if (!clientes.length) {
            const fila = document.createElement("tr");
            const td = celda("No hay clientes registrados.");
            td.colSpan = 7;
            fila.append(td);
            tabla.append(fila);
        } else {
            clientes.forEach(cliente => {
                const fila = document.createElement("tr");
                fila.dataset.id = String(cliente.idCliente);
                [
                    `CLI-${String(cliente.idCliente).padStart(3, "0")}`,
                    cliente.nombre,
                    cliente.correo,
                    cliente.telefono,
                    "—",
                    "—"
                ].forEach(valor => fila.append(celda(valor)));
                const acciones = celda("");
                acciones.append(
                    boton("Ver", () => verCliente(cliente.idCliente)),
                    boton("Editar", () => abrirEdicion(cliente.idCliente)),
                    boton("Eliminar", () => eliminarCliente(cliente.idCliente))
                );
                fila.append(acciones);
                tabla.append(fila);
            });
        }
        actualizarNegocios();
        actualizarIndicadores();
        filtrar();
    }

    async function cargarClientes() {
        cargando = true;
        botonCrear.disabled = true;
        const fila = document.createElement("tr");
        const td = celda("Cargando clientes...");
        td.colSpan = 7;
        fila.append(td);
        tabla.replaceChildren(fila);
        try {
            const contexto = await MGT.negocioActivo();
            idNegocioActivo = contexto.idNegocio;
            const datos = await MGT.request(`${API}?idNegocio=${encodeURIComponent(idNegocioActivo)}`);
            if (!Array.isArray(datos)) throw new Error("La API devolvió un formato inesperado.");
            clientes = datos;
            renderizar();
            notificar("");
        } catch (error) {
            clientes = [];
            actualizarIndicadores();
            actualizarNegocios();
            const errorFila = document.createElement("tr");
            const errorCelda = celda("No fue posible cargar clientes desde la API.");
            errorCelda.colSpan = 7;
            errorFila.append(errorCelda);
            tabla.replaceChildren(errorFila);
            if (resumen) resumen.textContent = "Error al consultar la API.";
            notificar(`Error al cargar clientes: ${error.message}`, "error");
        } finally {
            cargando = false;
            actualizarNegocios();
        }
    }

    function abrirFormulario(cliente = null) {
        formulario.reset();
        formulario.elements.idCliente.value = cliente?.idCliente || "";
        formulario.elements.nombre.value = cliente?.nombre || "";
        formulario.elements.correo.value = cliente?.correo || "";
        formulario.elements.telefono.value = cliente?.telefono || "";
        formulario.elements.observaciones.value = cliente?.observaciones || "";
        document.querySelector("#titulo-formulario-cliente").textContent =
            cliente ? "Editar cliente" : "Registrar cliente";
        panel.hidden = false;
        document.querySelector("#cliente-nombre").focus();
    }

    function validar() {
        const nombre = formulario.elements.nombre.value.trim();
        const correo = formulario.elements.correo.value.trim();
        const idNegocio = Number(idNegocioActivo);
        if (!Number.isSafeInteger(idNegocio) || idNegocio < 1) {
            notificar("Ingresa un ID de negocio válido.", "error");
            return false;
        }
        if (!nombre) {
            notificar("El nombre es obligatorio.", "error");
            formulario.elements.nombre.focus();
            return false;
        }
        if (nombre.length > 150 || correo.length > 190 ||
            formulario.elements.telefono.value.length > 30) {
            notificar("Revisa la longitud de los campos.", "error");
            return false;
        }
        if (correo && !formulario.elements.correo.validity.valid) {
            notificar("Ingresa un correo electrónico válido.", "error");
            formulario.elements.correo.focus();
            return false;
        }
        return true;
    }

    async function guardar(evento) {
        evento.preventDefault();
        if (!validar()) return;
        const id = formulario.elements.idCliente.value;
        const cliente = {
            idNegocio: Number(idNegocioActivo),
            nombre: formulario.elements.nombre.value.trim(),
            correo: formulario.elements.correo.value.trim() || null,
            telefono: formulario.elements.telefono.value.trim() || null,
            observaciones: formulario.elements.observaciones.value.trim() || null
        };
        const submit = formulario.querySelector('button[type="submit"]');
        submit.disabled = true;
        try {
            const url = id
                ? `${API}/${encodeURIComponent(id)}?idNegocio=${encodeURIComponent(cliente.idNegocio)}`
                : API;
            await MGT.request(url, {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(cliente)
            });
            panel.hidden = true;
            await cargarClientes();
            notificar(id ? "Cliente actualizado correctamente." : "Cliente registrado correctamente.", "success");
        } catch (error) {
            notificar(`No se pudo guardar el cliente: ${error.message}`, "error");
        } finally {
            submit.disabled = false;
        }
    }

    async function verCliente(id) {
        try {
            const cliente = await MGT.request(`${API}/${encodeURIComponent(id)}?idNegocio=${encodeURIComponent(idNegocioActivo)}`);
            window.alert(
                `Cliente CLI-${String(cliente.idCliente).padStart(3, "0")}\n` +
                `Negocio: ${cliente.idNegocio}\nNombre: ${cliente.nombre}\n` +
                `Correo: ${cliente.correo || "—"}\nTeléfono: ${cliente.telefono || "—"}\n` +
                `Fecha de registro: ${cliente.fechaRegistro || "—"}\n` +
                `Observaciones: ${cliente.observaciones || "—"}`
            );
        } catch (error) {
            notificar(`No se pudo consultar el cliente: ${error.message}`, "error");
        }
    }

    async function abrirEdicion(id) {
        try {
            abrirFormulario(await MGT.request(`${API}/${encodeURIComponent(id)}?idNegocio=${encodeURIComponent(idNegocioActivo)}`));
        } catch (error) {
            notificar(`No se pudo consultar el cliente para editarlo: ${error.message}`, "error");
        }
    }

    async function eliminarCliente(id) {
        const cliente = clientes.find(c => String(c.idCliente) === String(id));
        if (!cliente || !window.confirm(`¿Deseas eliminar al cliente "${cliente.nombre}"?`)) return;
        try {
            await MGT.request(`${API}/${encodeURIComponent(id)}?idNegocio=${encodeURIComponent(idNegocioActivo)}`, { method: "DELETE" });
            await cargarClientes();
            notificar("Cliente eliminado correctamente.", "success");
        } catch (error) {
            notificar(`No se pudo eliminar el cliente: ${error.message}`, "error");
        }
    }

    botonCrear.addEventListener("click", () => {
        if (!botonCrear.disabled) abrirFormulario();
        else notificar("No hay un negocio activo disponible.", "error");
    });
    document.querySelector("#cancelar-cliente").addEventListener("click", () => {
        panel.hidden = true;
    });
    formulario.addEventListener("submit", guardar);
    filtros.addEventListener("submit", event => { event.preventDefault(); filtrar(); });
    filtros.addEventListener("reset", () => setTimeout(filtrar, 0));
    buscador.addEventListener("input", filtrar);
    filtroTipo.addEventListener("change", filtrar);

    cargarClientes();
});

