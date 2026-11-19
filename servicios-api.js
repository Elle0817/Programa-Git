"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    if (!document.body.dataset.apiServicios) return;

    const API = "/api/servicios";
    let NEGOCIO_ID = null;
    let categorias = [];

    const tabla = document.querySelector("main section:nth-of-type(2) tbody");
    const formulario = document.querySelector("#formulario-servicio");
    const modal = document.querySelector("#modal-servicio");
    const filtros = document.querySelector("#formulario-filtros");
    const buscador = document.querySelector("#buscar-servicio");
    const filtroCategoria = document.querySelector("#categoria");
    const filtroEstado = document.querySelector("#estado");
    const botonCrear = document.querySelector("#crear-servicio");
    const botonCancelar = document.querySelector("#cancelar-servicio");
    const resumen = document.querySelector("main section:nth-of-type(2) footer > p");

    if (!tabla || !formulario || !modal) return;

    let servicios = [];
    let idEdicion = null;

    function configurarCategorias() {
        const categoriaForm = campo("categoria");
        filtroCategoria.replaceChildren(new Option("Todas", ""));
        categoriaForm.replaceChildren(new Option("Sin categoría", ""));
        categorias.forEach(categoria => {
            filtroCategoria.add(new Option(categoria.nombre, categoria.idCategoria));
            categoriaForm.add(new Option(categoria.nombre, categoria.idCategoria));
        });
    }

    const campo = nombre => formulario.elements.namedItem(nombre);

    function dinero(valor) {
        return Number(valor || 0).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 2
        });
    }

    function duracion(minutos) {
        if (minutos == null) return "No definida";
        const horas = minutos / 60;
        return Number.isInteger(horas)
            ? `${horas} ${horas === 1 ? "hora" : "horas"}`
            : `${minutos} minutos`;
    }

    function actualizarIndicadores() {
        const seccion = document.querySelector("#resumen-titulo")?.closest("section");
        if (!seccion) return;

        const cantidades = [
            servicios.length,
            servicios.filter(s => s.estado === "Publicado").length,
            servicios.filter(s => s.estado === "Borrador").length,
            servicios.filter(s => s.estado === "Inactivo").length
        ];

        seccion.querySelectorAll("article p:first-of-type").forEach((p, i) => {
            if (cantidades[i] !== undefined) p.textContent = cantidades[i];
        });
    }

    function filtrar() {
        const texto = buscador.value.trim().toLowerCase();
        const categoria = filtroCategoria.value;
        const estado = filtroEstado.value;
        let visibles = 0;

        tabla.querySelectorAll("tr").forEach(fila => {
            const servicio = servicios.find(
                s => String(s.idServicio) === fila.dataset.id
            );
            if (!servicio) return;

            const coincideTexto = servicio.nombre.toLowerCase().includes(texto);
            const coincideCategoria = !categoria ||
                String(servicio.idCategoria ?? "") === categoria;
            const coincideEstado = !estado || servicio.estado === estado;

            fila.hidden = !(coincideTexto && coincideCategoria && coincideEstado);
            if (!fila.hidden) visibles++;
        });

        if (resumen) {
            resumen.textContent = `Mostrando ${visibles} de ${servicios.length} servicios`;
        }
    }

    function boton(texto, accion) {
        const elemento = document.createElement("button");
        elemento.type = "button";
        elemento.textContent = texto;
        elemento.addEventListener("click", accion);
        return elemento;
    }

    function renderizar() {
        tabla.replaceChildren();

        servicios.forEach(servicio => {
            const fila = document.createElement("tr");
            fila.dataset.id = String(servicio.idServicio);

            [
                servicio.nombre,
                categorias.find(c => Number(c.idCategoria) === Number(servicio.idCategoria))?.nombre || "Sin categoría",
                dinero(servicio.precio),
                duracion(servicio.duracionMinutos),
                servicio.cupos,
                servicio.estado
            ].forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = valor ?? "";
                fila.appendChild(celda);
            });

            const acciones = document.createElement("td");
            acciones.append(
                boton("Editar", () => abrirEdicion(servicio)),
                boton("Ver", () => alert(
                    `Servicio: ${servicio.nombre}\n` +
                    `Descripción: ${servicio.descripcion || "Sin descripción"}\n` +
                    `Precio: ${dinero(servicio.precio)}\n` +
                    `Duración: ${duracion(servicio.duracionMinutos)}\n` +
                    `Cupos: ${servicio.cupos}\nEstado: ${servicio.estado}`
                )),
                boton("Eliminar", () => eliminar(servicio))
            );
            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });

        actualizarIndicadores();
        filtrar();
    }

    async function cargarServicios() {
        try {
            servicios = await MGT.request(`${API}?idNegocio=${encodeURIComponent(NEGOCIO_ID)}`);
            renderizar();
        } catch (error) {
            console.error(error);
            alert("No se pudieron cargar los servicios: " + error.message);
        }
    }

    function abrirEdicion(servicio) {
        idEdicion = servicio.idServicio;
        campo("nombre").value = servicio.nombre;
        campo("categoria").value = String(servicio.idCategoria ?? "");
        campo("descripcion").value = servicio.descripcion || "";
        campo("precio").value = servicio.precio;
        campo("duracion").value = servicio.duracionMinutos == null
            ? "" : servicio.duracionMinutos / 60;
        campo("cupos").value = servicio.cupos;
        campo("estado").value = servicio.estado;
        document.querySelector("#titulo-formulario").textContent = "Editar servicio turístico";
        formulario.querySelector('button[type="submit"]').textContent = "Guardar cambios";
        modal.hidden = false;
        campo("nombre").focus();
    }

    function cerrarModal() {
        modal.hidden = true;
        formulario.reset();
        idEdicion = null;
        document.querySelector("#titulo-formulario").textContent = "Crear servicio turístico";
        formulario.querySelector('button[type="submit"]').textContent = "Guardar servicio";
    }

    async function eliminar(servicio) {
        if (!confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) return;

        try {
            await MGT.request(`${API}/${encodeURIComponent(servicio.idServicio)}`, { method: "DELETE" });
            await cargarServicios();
        } catch (error) {
            alert("No se pudo eliminar el servicio: " + error.message);
        }
    }

    botonCrear.addEventListener("click", () => {
        cerrarModal();
        modal.hidden = false;
        campo("nombre").focus();
    });

    botonCancelar?.addEventListener("click", cerrarModal);

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !modal.hidden) cerrarModal();
    });

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const duracionHoras = Number(campo("duracion").value);
        const datos = {
            idNegocio: NEGOCIO_ID,
            idCategoria: campo("categoria").value ? Number(campo("categoria").value) : null,
            nombre: campo("nombre").value.trim(),
            descripcion: campo("descripcion").value.trim() || null,
            precio: Number(campo("precio").value),
            duracionMinutos: Math.round(duracionHoras * 60),
            cupos: Number(campo("cupos").value),
            estado: campo("estado").value
        };

        if (!datos.nombre || !Number.isFinite(datos.precio) ||
            datos.precio < 0 || !Number.isFinite(duracionHoras) ||
            duracionHoras <= 0 || !Number.isInteger(datos.cupos) ||
            datos.cupos < 0) {
            alert("Verifica el nombre, el precio, la duración y los cupos.");
            return;
        }

        try {
            await MGT.request(
                idEdicion === null ? API : `${API}/${idEdicion}`,
                {
                    method: idEdicion === null ? "POST" : "PUT",
                    body: JSON.stringify(datos)
                }
            );
            cerrarModal();
            await cargarServicios();
            alert("Servicio guardado correctamente en MySQL.");
        } catch (error) {
            alert("No se pudo guardar el servicio: " + error.message);
        }
    });

    filtros.addEventListener("submit", evento => {
        evento.preventDefault();
        filtrar();
    });
    filtros.addEventListener("reset", () => setTimeout(filtrar, 0));
    buscador.addEventListener("input", filtrar);
    filtroCategoria.addEventListener("change", filtrar);
    filtroEstado.addEventListener("change", filtrar);

    try {
        const contexto = await MGT.negocioActivo();
        NEGOCIO_ID = contexto.idNegocio;
        categorias = await MGT.request("/api/categorias-servicios");
        configurarCategorias();
        await cargarServicios();
    } catch (error) {
        alert("No se pudo cargar el negocio activo o sus servicios: " + error.message);
    }
});
