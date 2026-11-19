"use strict";

/* =========================================================
   MI GUÍA TURÍSTICO
   JavaScript compartido por las ocho páginas HTML.
   Almacenamiento local: localStorage.
========================================================= */

const CLAVES = {
    servicios: "miGuiaTuristicoServicios",
    reservas: "miGuiaTuristicoReservas",
    clientes: "miGuiaTuristicoClientes",
    costos: "miGuiaTuristicoCostos",
    actividades: "miGuiaTuristicoActividades",
    negocio: "miGuiaTuristicoNegocio",
    contacto: "miGuiaTuristicoContacto",
    preferencias: "miGuiaTuristicoPreferencias",
    notificaciones: "miGuiaTuristicoNotificaciones"
};

const $ = (selector, contexto = document) =>
    contexto.querySelector(selector);

const $$ = (selector, contexto = document) =>
    Array.from(contexto.querySelectorAll(selector));

function leerDatos(clave, valorPredeterminado) {
    try {
        const datos = localStorage.getItem(clave);
        return datos === null ? valorPredeterminado : JSON.parse(datos);
    } catch (error) {
        console.error("No se pudieron leer los datos:", clave, error);
        return valorPredeterminado;
    }
}

function guardarDatos(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los datos:", clave, error);
        alert("No se pudieron guardar los datos en este navegador.");
        return false;
    }
}

function mostrarMensaje(mensaje) {
    alert(mensaje);
}

function crearCelda(valor) {
    const celda = document.createElement("td");
    celda.textContent = valor ?? "";
    return celda;
}

function crearBoton(texto, accion, clase = "") {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;

    if (clase) {
        boton.className = clase;
    }

    boton.addEventListener("click", accion);
    return boton;
}

function obtenerFilasIniciales(selector) {
    const cuerpo = $(selector);

    if (!cuerpo) {
        return [];
    }

    return $$("#" + CSS.escape(cuerpo.id) + " tr").map(fila =>
        Array.from(fila.cells).map(celda => celda.textContent.trim())
    );
}

function dinero(valor) {
    return "$" + Number(valor || 0).toLocaleString("es-CO") + " COP";
}

function fechaHoy() {
    const fecha = new Date();
    const zona = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - zona).toISOString().slice(0, 10);
}

function configurarFormulario(formulario, clave, nombresCampos) {
    if (!formulario) return;

    const datosGuardados = leerDatos(clave, {});

    nombresCampos.forEach(nombre => {
        const campo = formulario.elements.namedItem(nombre);

        if (!campo) return;

        if (campo.type === "checkbox") {
            campo.checked = datosGuardados[nombre] ?? campo.checked;
        } else if (datosGuardados[nombre] !== undefined) {
            campo.value = datosGuardados[nombre];
        }
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const datos = {};

        nombresCampos.forEach(nombre => {
            const campo = formulario.elements.namedItem(nombre);
            if (!campo) return;

            datos[nombre] = campo.type === "checkbox"
                ? campo.checked
                : campo.value;
        });

        if (guardarDatos(clave, datos)) {
            mostrarMensaje("La información se guardó correctamente.");
        }
    });
}

/* =========================================================
   1. SERVICIOS
========================================================= */

function iniciarServicios() {
    const tabla = $("#modal-servicio") && $("tbody");
    const buscador = $("#buscar-servicio");
    const categoria = $("#categoria");
    const estado = $("#estado");
    const filtros = $("#formulario-filtros");
    const modal = $("#modal-servicio");
    const formulario = $("#formulario-servicio");
    const botonCrear = $("#crear-servicio");
    const botonCancelar = $("#cancelar-servicio");

    if (!tabla || !buscador || !categoria || !estado ||
        !filtros || !modal || !formulario || !botonCrear) {
        return;
    }

    const iniciales = Array.from(tabla.rows).map(fila => ({
        nombre: fila.cells[0].textContent.trim(),
        categoria: fila.cells[1].textContent.trim(),
        precio: Number(fila.cells[2].textContent.replace(/\D/g, "")),
        duracion: Number(fila.cells[3].textContent.replace(/\D/g, "")),
        cupos: Number(fila.cells[4].textContent.trim()),
        estado: fila.cells[5].textContent.trim()
    }));

    let servicios = leerDatos(CLAVES.servicios, iniciales);

    function actualizarIndicadores() {
        const articulos = $$("#resumen-titulo")
            .flatMap(titulo => {
                const seccion = titulo.closest("section");
                return seccion ? $$("article p:first-of-type", seccion) : [];
            });

        const cantidades = [
            servicios.length,
            servicios.filter(s => s.estado === "Publicado").length,
            servicios.filter(s => s.estado === "Borrador").length,
            servicios.filter(s => s.estado === "Inactivo").length
        ];

        articulos.forEach((elemento, indice) => {
            if (cantidades[indice] !== undefined) {
                elemento.textContent = cantidades[indice];
            }
        });
    }

    function filtrar() {
        const texto = buscador.value.trim().toLowerCase();
        let visibles = 0;

        Array.from(tabla.rows).forEach(fila => {
            const coincideNombre =
                fila.cells[0].textContent.toLowerCase().includes(texto);

            const coincideCategoria =
                !categoria.value || fila.cells[1].textContent === categoria.value;

            const coincideEstado =
                !estado.value || fila.cells[5].textContent === estado.value;

            const mostrar = coincideNombre && coincideCategoria && coincideEstado;
            fila.hidden = !mostrar;

            if (mostrar) visibles++;
        });

        const resumen = $("main > section:nth-of-type(2) > footer > p");
        if (resumen) {
            resumen.textContent =
                `Mostrando ${visibles} de ${servicios.length} servicios`;
        }
    }

    function renderizar() {
        tabla.replaceChildren();

        servicios.forEach((servicio, indice) => {
            const fila = document.createElement("tr");

            [
                servicio.nombre,
                servicio.categoria,
                dinero(servicio.precio),
                `${servicio.duracion} ${Number(servicio.duracion) === 1 ? "hora" : "horas"}`,
                servicio.cupos,
                servicio.estado
            ].forEach(valor => fila.appendChild(crearCelda(valor)));

            const acciones = crearCelda("");

            acciones.append(
                crearBoton("Editar", () => editarServicio(indice)),
                crearBoton("Ver", () => {
                    mostrarMensaje(
                        `Servicio: ${servicio.nombre}\n` +
                        `Categoría: ${servicio.categoria}\n` +
                        `Precio: ${dinero(servicio.precio)}\n` +
                        `Duración: ${servicio.duracion} horas\n` +
                        `Cupos: ${servicio.cupos}\nEstado: ${servicio.estado}`
                    );
                }),
                crearBoton("Eliminar", () => {
                    if (confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) {
                        servicios.splice(indice, 1);
                        guardarDatos(CLAVES.servicios, servicios);
                        renderizar();
                    }
                })
            );

            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });

        filtrar();
        actualizarIndicadores();
    }

    function editarServicio(indice) {
        const servicio = servicios[indice];

        const nombre = prompt("Nombre del servicio:", servicio.nombre);
        if (nombre === null || !nombre.trim()) return;

        const precio = prompt("Precio en COP:", servicio.precio);
        if (precio === null || precio.trim() === "") return;

        const precioNumero = Number(precio);
        if (!Number.isFinite(precioNumero) || precioNumero < 0) {
            mostrarMensaje("Ingresa un precio válido.");
            return;
        }

        servicio.nombre = nombre.trim();
        servicio.precio = precioNumero;

        guardarDatos(CLAVES.servicios, servicios);
        renderizar();
    }

    function cerrarModal() {
        modal.hidden = true;
        formulario.reset();
    }

    botonCrear.addEventListener("click", () => {
        modal.hidden = false;
        $("#nombre-servicio").focus();
    });

    if (botonCancelar) {
        botonCancelar.addEventListener("click", cerrarModal);
    }

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !modal.hidden) cerrarModal();
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const datos = new FormData(formulario);
        const nuevo = {
            nombre: String(datos.get("nombre") || "").trim(),
            categoria: datos.get("categoria"),
            precio: Number(datos.get("precio")),
            duracion: Number(datos.get("duracion")),
            cupos: Number(datos.get("cupos")),
            estado: datos.get("estado")
        };

        if (
            !nuevo.nombre ||
            !nuevo.categoria ||
            !Number.isFinite(nuevo.precio) || nuevo.precio < 0 ||
            !Number.isInteger(nuevo.duracion) || nuevo.duracion < 1 ||
            !Number.isInteger(nuevo.cupos) || nuevo.cupos < 0
        ) {
            mostrarMensaje("Verifica los datos del servicio.");
            return;
        }

        servicios.push(nuevo);

        if (guardarDatos(CLAVES.servicios, servicios)) {
            renderizar();
            cerrarModal();
            mostrarMensaje("Servicio creado correctamente.");
        }
    });

    filtros.addEventListener("submit", evento => {
        evento.preventDefault();
        filtrar();
    });

    filtros.addEventListener("reset", () => {
        setTimeout(filtrar, 0);
    });

    buscador.addEventListener("input", filtrar);
    categoria.addEventListener("change", filtrar);
    estado.addEventListener("change", filtrar);

    renderizar();
}

/* =========================================================
   2. RESERVAS
========================================================= */

function iniciarReservas() {
    const tabla = $("#tabla-reservas");
    const filtros = $("#formulario-filtros-reservas");

    if (!tabla || !filtros) return;

    const iniciales = Array.from(tabla.rows).map(fila => ({
        codigo: fila.cells[0].textContent.trim(),
        cliente: fila.cells[1].textContent.trim(),
        servicio: fila.cells[2].textContent.trim(),
        fecha: fila.cells[3].textContent.trim(),
        personas: Number(fila.cells[4].textContent),
        valor: Number(fila.cells[5].textContent.replace(/\D/g, "")),
        estado: fila.cells[6].textContent.trim()
    }));

    let reservas = leerDatos(CLAVES.reservas, iniciales);

    function indicadores() {
        const seccion = $("#resumen-titulo")?.closest("section");
        if (!seccion) return;

        const cantidades = [
            reservas.length,
            reservas.filter(r => r.estado === "Pendiente").length,
            reservas.filter(r => r.estado === "Confirmada").length,
            reservas.filter(r => r.estado === "Cancelada").length
        ];

        $$("article p:first-of-type", seccion).forEach((p, i) => {
            if (cantidades[i] !== undefined) p.textContent = cantidades[i];
        });
    }

    function filtrar() {
        const texto = ($("#buscar-reserva")?.value || "").toLowerCase().trim();
        const estado = $("#filtro-estado-reserva")?.value || "";
        const fecha = $("#filtro-fecha-reserva")?.value || "";
        let visibles = 0;

        Array.from(tabla.rows).forEach(fila => {
            const coincideTexto =
                `${fila.cells[1].textContent} ${fila.cells[2].textContent}`
                    .toLowerCase().includes(texto);

            const mostrar = coincideTexto &&
                (!estado || fila.cells[6].textContent === estado) &&
                (!fecha || fila.cells[3].textContent === fecha);

            fila.hidden = !mostrar;
            if (mostrar) visibles++;
        });

        const resumen = $("main > section:nth-of-type(2) > footer > p");
        if (resumen) resumen.textContent = `Mostrando ${visibles} de ${reservas.length} reservas`;
    }

    function renderizar() {
        tabla.replaceChildren();

        reservas.forEach((reserva, indice) => {
            const fila = document.createElement("tr");

            [
                reserva.codigo,
                reserva.cliente,
                reserva.servicio,
                reserva.fecha,
                reserva.personas,
                dinero(reserva.valor),
                reserva.estado
            ].forEach(valor => fila.appendChild(crearCelda(valor)));

            const acciones = crearCelda("");

            acciones.append(
                crearBoton("Ver", () => {
                    mostrarMensaje(
                        `Reserva ${reserva.codigo}\nCliente: ${reserva.cliente}\n` +
                        `Servicio: ${reserva.servicio}\nFecha: ${reserva.fecha}\n` +
                        `Personas: ${reserva.personas}\nValor: ${dinero(reserva.valor)}\n` +
                        `Estado: ${reserva.estado}`
                    );
                })
            );

            if (reserva.estado === "Pendiente") {
                acciones.appendChild(crearBoton("Confirmar", () => {
                    reserva.estado = "Confirmada";
                    guardarDatos(CLAVES.reservas, reservas);
                    renderizar();
                }));
            }

            if (reserva.estado !== "Cancelada" && reserva.estado !== "Completada") {
                acciones.appendChild(crearBoton("Cancelar", () => {
                    if (confirm(`¿Cancelar la reserva ${reserva.codigo}?`)) {
                        reserva.estado = "Cancelada";
                        guardarDatos(CLAVES.reservas, reservas);
                        renderizar();
                    }
                }));
            }

            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });

        indicadores();
        filtrar();
    }

    filtros.addEventListener("submit", evento => {
        evento.preventDefault();
        filtrar();
    });

    filtros.addEventListener("reset", () => setTimeout(filtrar, 0));

    $("#buscar-reserva")?.addEventListener("input", filtrar);
    $("#filtro-estado-reserva")?.addEventListener("change", filtrar);
    $("#filtro-fecha-reserva")?.addEventListener("change", filtrar);

    renderizar();
}

/* El módulo de clientes se controla exclusivamente desde clientes-api.js. */

/* =========================================================
   4. COSTOS
========================================================= */

function iniciarCostos() {
    const tabla = $("#tabla-costos");
    const filtros = $("#formulario-filtros-costos");

    if (!tabla || !filtros) return;

    const iniciales = Array.from(tabla.rows).map(fila => ({
        codigo: fila.cells[0].textContent.trim(),
        concepto: fila.cells[1].textContent.trim(),
        categoria: fila.cells[2].textContent.trim(),
        fecha: fila.cells[3].textContent.trim(),
        valor: Number(fila.cells[4].textContent.replace(/\D/g, "")),
        observaciones: fila.cells[5].textContent.trim()
    }));

    let costos = leerDatos(CLAVES.costos, iniciales);

    function actualizarIndicadores() {
        const seccion = $("#resumen-costos")?.closest("section");
        if (!seccion) return;

        const total = costos.reduce((suma, c) => suma + Number(c.valor || 0), 0);
        const operativos = costos
            .filter(c => c.categoria === "Operación" || c.categoria === "Transporte" ||
                c.categoria === "Mantenimiento")
            .reduce((suma, c) => suma + Number(c.valor || 0), 0);

        const personal = costos
            .filter(c => c.categoria === "Personal")
            .reduce((suma, c) => suma + Number(c.valor || 0), 0);

        const otros = total - operativos - personal;

        const valores = [total, operativos, personal, otros];

        $$("article p:first-of-type", seccion).forEach((p, i) => {
            if (valores[i] !== undefined) p.textContent = dinero(valores[i]);
        });
    }

    function filtrar() {
        const texto = ($("#buscar-costo")?.value || "").toLowerCase().trim();
        const categoria = $("#filtro-categoria-costo")?.value || "";
        const fecha = $("#filtro-fecha-costo")?.value || "";
        let visibles = 0;

        Array.from(tabla.rows).forEach(fila => {
            const coincideTexto = fila.cells[1].textContent.toLowerCase().includes(texto);
            const coincideCategoria = !categoria || fila.cells[2].textContent === categoria;
            const coincideFecha = !fecha || fila.cells[3].textContent === fecha;

            fila.hidden = !(coincideTexto && coincideCategoria && coincideFecha);
            if (!fila.hidden) visibles++;
        });

        const resumen = $("main > section:nth-of-type(2) > footer > p");
        if (resumen) resumen.textContent = `Mostrando ${visibles} de ${costos.length} gastos`;
    }

    function renderizar() {
        tabla.replaceChildren();

        costos.forEach((costo, indice) => {
            const fila = document.createElement("tr");

            [
                costo.codigo,
                costo.concepto,
                costo.categoria,
                costo.fecha,
                dinero(costo.valor),
                costo.observaciones
            ].forEach(valor => fila.appendChild(crearCelda(valor)));

            const acciones = crearCelda("");

            acciones.append(
                crearBoton("Editar", () => {
                    const concepto = prompt("Concepto del gasto:", costo.concepto);
                    if (concepto === null || !concepto.trim()) return;

                    const valor = prompt("Valor en COP:", costo.valor);
                    if (valor === null) return;

                    const numero = Number(valor);
                    if (!Number.isFinite(numero) || numero < 0) {
                        mostrarMensaje("Ingresa un valor válido.");
                        return;
                    }

                    costo.concepto = concepto.trim();
                    costo.valor = numero;

                    guardarDatos(CLAVES.costos, costos);
                    renderizar();
                }),
                crearBoton("Eliminar", () => {
                    if (confirm(`¿Eliminar el gasto "${costo.concepto}"?`)) {
                        costos.splice(indice, 1);
                        guardarDatos(CLAVES.costos, costos);
                        renderizar();
                    }
                })
            );

            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });

        filtrar();
        actualizarIndicadores();
    }

    function registrarCosto() {
        const concepto = prompt("Concepto del gasto:");
        if (concepto === null || !concepto.trim()) return;

        const categorias = [
            "Operación", "Personal", "Transporte",
            "Marketing", "Mantenimiento", "Otros"
        ];

        const categoria = prompt(
            "Categoría:\n" + categorias.join(", "),
            "Operación"
        );

        if (categoria === null || !categorias.includes(categoria)) {
            mostrarMensaje("Selecciona una categoría válida.");
            return;
        }

        const valor = Number(prompt("Valor del gasto en COP:", "0"));

        if (!Number.isFinite(valor) || valor < 0) {
            mostrarMensaje("Ingresa un valor válido.");
            return;
        }

        const observaciones = prompt("Observaciones:", "") || "";
        const siguiente = costos.length + 1;

        costos.push({
            codigo: "COS-" + String(siguiente).padStart(3, "0"),
            concepto: concepto.trim(),
            categoria,
            fecha: fechaHoy(),
            valor,
            observaciones
        });

        if (guardarDatos(CLAVES.costos, costos)) {
            renderizar();
            mostrarMensaje("Gasto registrado correctamente.");
        }
    }

    $("#crear-costo")?.addEventListener("click", registrarCosto);

    filtros.addEventListener("submit", evento => {
        evento.preventDefault();
        filtrar();
    });

    filtros.addEventListener("reset", () => setTimeout(filtrar, 0));

    $("#buscar-costo")?.addEventListener("input", filtrar);
    $("#filtro-categoria-costo")?.addEventListener("change", filtrar);
    $("#filtro-fecha-costo")?.addEventListener("change", filtrar);

    renderizar();
}

/* =========================================================
   5. CALENDARIO
========================================================= */

function iniciarCalendario() {
    const titulo = $("#calendario-titulo");
    const tabla = $("section table caption")?.closest("table");

    if (!titulo || !tabla) return;

    let mesActual = new Date(2026, 9, 1);
    let actividades = leerDatos(CLAVES.actividades, []);

    const seccionCalendario = titulo.closest("section");
    const botones = $$("button", seccionCalendario);

    const botonAnterior = botones.find(b => b.textContent.includes("Mes anterior"));
    const botonSiguiente = botones.find(b => b.textContent.includes("Mes siguiente"));
    const botonCrear = $("#crear-actividad");

    if (botonAnterior) botonAnterior.disabled = false;
    if (botonSiguiente) botonSiguiente.disabled = false;
    if (botonCrear) botonCrear.disabled = false;

    function renderizarCalendario() {
        const anio = mesActual.getFullYear();
        const mes = mesActual.getMonth();

        titulo.textContent = mesActual.toLocaleDateString("es-CO", {
            month: "long",
            year: "numeric"
        });

        const cuerpo = $("tbody", tabla);
        cuerpo.replaceChildren();

        const primerDia = new Date(anio, mes, 1);
        const desplazamiento = (primerDia.getDay() + 6) % 7;
        const diasMes = new Date(anio, mes + 1, 0).getDate();

        let dia = 1 - desplazamiento;

        for (let semana = 0; semana < 6 && dia <= diasMes; semana++) {
            const fila = document.createElement("tr");

            for (let columna = 0; columna < 7; columna++, dia++) {
                const celda = document.createElement("td");

                if (dia < 1) {
                    const anterior = new Date(anio, mes, dia);
                    celda.textContent = anterior.getDate() + " " +
                        anterior.toLocaleDateString("es-CO", { month: "short" });
                } else if (dia > diasMes) {
                    const siguiente = new Date(anio, mes, dia);
                    celda.textContent = siguiente.getDate() + " " +
                        siguiente.toLocaleDateString("es-CO", { month: "short" });
                } else {
                    const fecha = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                    const hora = document.createElement("time");
                    hora.dateTime = fecha;
                    hora.textContent = dia;
                    celda.appendChild(hora);

                    actividades.filter(a => a.fecha === fecha).forEach(a => {
                        const p = document.createElement("p");
                        p.textContent = a.nombre;
                        celda.appendChild(p);
                    });
                }

                fila.appendChild(celda);
            }

            cuerpo.appendChild(fila);
        }
    }

    if (botonAnterior) {
        botonAnterior.addEventListener("click", () => {
            mesActual = new Date(
                mesActual.getFullYear(),
                mesActual.getMonth() - 1,
                1
            );
            renderizarCalendario();
        });
    }

    if (botonSiguiente) {
        botonSiguiente.addEventListener("click", () => {
            mesActual = new Date(
                mesActual.getFullYear(),
                mesActual.getMonth() + 1,
                1
            );
            renderizarCalendario();
        });
    }

    if (botonCrear) {
        botonCrear.addEventListener("click", () => {
            const nombre = prompt("Nombre de la actividad:");
            if (nombre === null || !nombre.trim()) return;

            const fecha = prompt("Fecha de la actividad (AAAA-MM-DD):", fechaHoy());
            if (fecha === null || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                mostrarMensaje("Ingresa una fecha válida con formato AAAA-MM-DD.");
                return;
            }

            actividades.push({ nombre: nombre.trim(), fecha });

            if (guardarDatos(CLAVES.actividades, actividades)) {
                mesActual = new Date(
                    Number(fecha.slice(0, 4)),
                    Number(fecha.slice(5, 7)) - 1,
                    1
                );
                renderizarCalendario();
                mostrarMensaje("Actividad agregada al calendario.");
            }
        });
    }

    renderizarCalendario();
}

/* =========================================================
   6. REPORTES Y EXPORTACIÓN CSV
========================================================= */

function iniciarReportes() {
    const formulario = $("#formulario-periodo-reporte");

    if (!formulario) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const inicio = $("#fecha-inicio-reporte").value;
        const fin = $("#fecha-fin-reporte").value;

        if (inicio && fin && inicio > fin) {
            mostrarMensaje("La fecha inicial no puede ser posterior a la fecha final.");
            return;
        }

        mostrarMensaje(
            "Se aplicó el periodo seleccionado.\n" +
            "Los indicadores actuales siguen siendo datos de ejemplo; " +
            "la integración de todos los reportes se realizará al conectar los datos."
        );
    });

    formulario.addEventListener("reset", () => {
        setTimeout(() => {
            $("#fecha-inicio-reporte").value = "";
            $("#fecha-fin-reporte").value = "";
        }, 0);
    });

    function descargarCSV(nombreArchivo, filas) {
        const contenido = filas.map(fila =>
            fila.map(valor =>
                '"' + String(valor ?? "").replace(/"/g, '""') + '"'
            ).join(";")
        ).join("\r\n");

        const archivo = new Blob(["\uFEFF" + contenido], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();

        URL.revokeObjectURL(url);
    }

    $("#exportar-csv")?.addEventListener("click", () => {
        const tablas = $$("main table");
        const filas = [];

        tablas.forEach((tabla, indiceTabla) => {
            if (indiceTabla > 0) filas.push([]);

            $$("tr", tabla).forEach(fila => {
                filas.push(Array.from(fila.cells).map(celda => celda.textContent.trim()));
            });
        });

        if (filas.length) {
            descargarCSV("reporte-mi-guia-turistico.csv", filas);
        }
    });

    $("#exportar-csv")?.removeAttribute("disabled");

    $("#exportar-pdf")?.addEventListener("click", () => {
        mostrarMensaje(
            "La exportación a PDF requiere implementar una biblioteca específica. " +
            "Por ahora puedes usar Imprimir > Guardar como PDF en tu navegador."
        );
        window.print();
    });

    $("#exportar-pdf")?.removeAttribute("disabled");
}

/* =========================================================
   7. CONFIGURACIÓN DEL NEGOCIO
========================================================= */

function iniciarConfiguracion() {
    configurarFormulario(
        $("#formulario-negocio"),
        CLAVES.negocio,
        ["nombre", "nit", "descripcion", "direccion", "ciudad"]
    );

    configurarFormulario(
        $("#formulario-contacto"),
        CLAVES.contacto,
        ["correo", "telefono", "sitio", "redSocial"]
    );

    configurarFormulario(
        $("#formulario-preferencias"),
        CLAVES.preferencias,
        ["anticipacion", "cancelacion", "moneda"]
    );

    configurarFormulario(
        $("#formulario-notificaciones"),
        CLAVES.notificaciones,
        ["nuevaReserva", "cancelacionReserva", "recordatorios", "resumenSemanal"]
    );
}

/* =========================================================
   8. DASHBOARD
========================================================= */

function iniciarDashboard() {
    if (!$("main") || $("#tabla-reservas") || $("#tabla-clientes") ||
        $("#tabla-costos") || $("#modal-servicio")) {
        return;
    }

    // El dashboard conserva sus indicadores de ejemplo por ahora.
    // Se conectará a los datos de todas las secciones en una etapa posterior.
}

/* =========================================================
   9. INICIAR SOLO LAS FUNCIONES DE LA PÁGINA ACTUAL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.dataset.apiServicios) iniciarServicios();
    iniciarReservas();
    iniciarCostos();
    iniciarCalendario();
    iniciarReportes();
    iniciarConfiguracion();
    iniciarDashboard();
});


