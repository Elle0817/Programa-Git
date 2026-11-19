"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const $ = s => document.querySelector(s);
    const tabla = $("#tabla-costos");
    const form = $("#formulario-costo");
    const panel = $("#panel-formulario-costo");
    let categorias = [];

    function fechaLocal(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") +
            "-" + String(date.getDate()).padStart(2, "0");
    }

    function filtros() {
        return {
            q: $("#buscar-costo").value.trim(),
            idCategoriaCosto: $("#filtro-categoria-costo").value,
            desde: $("#costos-desde").value,
            hasta: $("#costos-hasta").value
        };
    }

    function optionize(select, rows, label) {
        const selected = select.value;
        select.replaceChildren(new Option(label, ""));
        rows.forEach(c => select.add(new Option(c.nombre, c.idCategoriaCosto)));
        if (rows.some(c => String(c.idCategoriaCosto) === selected)) select.value = selected;
    }

    async function cargarCategorias() {
        await MGT.negocioActivo();
        categorias = await MGT.request("/api/costos/categorias");
        optionize($("#costo-categoria"), categorias, "Sin categoría");
        optionize($("#filtro-categoria-costo"), categorias, "Todas");
    }

    async function cargar() {
        try {
            await MGT.negocioActivo();
            const params = filtros();
            const [costos, resumen] = await Promise.all([
                MGT.request("/api/costos" + MGT.query(params)),
                MGT.request("/api/costos/resumen" + MGT.query(params))
            ]);
            render(costos);
            $("#costos-total").textContent = MGT.dinero(resumen.total);
            $("#costos-cantidad").textContent = costos.length;
            $("#resumen-costos-lista").textContent = "Mostrando " + costos.length + " registros";
            MGT.mostrarMensaje("");
        } catch (error) {
            tabla.innerHTML = "<tr><td colspan='6'>No fue posible consultar los costos.</td></tr>";
            MGT.mostrarMensaje(error.message, "error");
        }
    }

    function render(rows) {
        tabla.replaceChildren();
        if (!rows.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 6;
            td.textContent = "No hay costos para los filtros seleccionados.";
            tr.append(td);
            tabla.append(tr);
            return;
        }
        rows.forEach(c => {
            const tr = document.createElement("tr");
            const category = categorias.find(x => Number(x.idCategoriaCosto) === Number(c.idCategoriaCosto));
            [c.concepto, category?.nombre || "Sin categoría", MGT.fecha(c.fechaCosto),
                MGT.dinero(c.valor), c.observaciones || "—"].forEach(v => {
                const td = document.createElement("td");
                td.textContent = v;
                tr.append(td);
            });
            const actions = document.createElement("td");
            actions.append(button("Ver", () => ver(c)), button("Editar", () => editar(c)),
                button("Eliminar", () => eliminar(c)));
            tr.append(actions);
            tabla.append(tr);
        });
    }

    function button(text, action) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.addEventListener("click", action);
        return b;
    }

    function abrir(c = null) {
        form.reset();
        form.elements.idCosto.value = c?.idCosto || "";
        form.elements.concepto.value = c?.concepto || "";
        form.elements.idCategoriaCosto.value = c?.idCategoriaCosto ?? "";
        form.elements.valor.value = c?.valor ?? "";
        form.elements.fechaCosto.value = c?.fechaCosto || fechaLocal(new Date());
        form.elements.observaciones.value = c?.observaciones || "";
        $("#titulo-formulario-costo").textContent = c ? "Editar costo" : "Registrar costo";
        panel.hidden = false;
        $("#costo-concepto").focus();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function ver(c) {
        const body = $("#detalle-costo");
        body.replaceChildren();
        const category = categorias.find(x => Number(x.idCategoriaCosto) === Number(c.idCategoriaCosto));
        [["Concepto", c.concepto], ["Categoría", category?.nombre || "Sin categoría"],
         ["Fecha", MGT.fecha(c.fechaCosto)], ["Valor", MGT.dinero(c.valor)],
         ["Observaciones", c.observaciones || "—"]].forEach(([k, v]) => {
            const p = document.createElement("p");
            p.textContent = k + ": " + v;
            body.append(p);
        });
        $("#panel-detalle-costo").hidden = false;
        $("#panel-detalle-costo").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function editar(c) {
        try { abrir(await MGT.request("/api/costos/" + encodeURIComponent(c.idCosto))); }
        catch (error) { MGT.mostrarMensaje(error.message, "error"); }
    }

    async function eliminar(c) {
        if (!window.confirm("¿Eliminar permanentemente el costo «" + c.concepto + "»?")) return;
        try {
            await MGT.request("/api/costos/" + encodeURIComponent(c.idCosto), { method: "DELETE" });
            MGT.mostrarMensaje("Costo eliminado.", "success");
            await cargar();
        } catch (error) { MGT.mostrarMensaje(error.message, "error"); }
    }

    $("#crear-costo").addEventListener("click", () => abrir());
    $("#cerrar-formulario-costo").addEventListener("click", () => { panel.hidden = true; });
    $("#cerrar-detalle-costo").addEventListener("click", () => { $("#panel-detalle-costo").hidden = true; });
    $("#filtros-costos").addEventListener("submit", async e => { e.preventDefault(); await cargar(); });
    $("#filtros-costos").addEventListener("reset", () => setTimeout(cargar, 0));

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const id = form.elements.idCosto.value;
        const raw = form.elements.valor.value;
        const amount = Number(raw);
        if (!form.elements.concepto.value.trim() || raw === "" || !Number.isFinite(amount) || amount < 0) {
            MGT.mostrarMensaje("Revisa el concepto y el valor del costo.", "error");
            return;
        }
        const payload = {
            idCategoriaCosto: form.elements.idCategoriaCosto.value ? Number(form.elements.idCategoriaCosto.value) : null,
            concepto: form.elements.concepto.value.trim(),
            valor: amount,
            fechaCosto: form.elements.fechaCosto.value,
            observaciones: form.elements.observaciones.value.trim() || null
        };
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            await MGT.request(id ? "/api/costos/" + encodeURIComponent(id) : "/api/costos", {
                method: id ? "PUT" : "POST", body: JSON.stringify(payload)
            });
            panel.hidden = true;
            MGT.mostrarMensaje(id ? "Costo actualizado." : "Costo registrado.", "success");
            await cargar();
        } catch (error) { MGT.mostrarMensaje(error.message, "error"); }
        finally { submit.disabled = false; }
    });

    try { await cargarCategorias(); await cargar(); }
    catch (error) { MGT.mostrarMensaje(error.message, "error"); }
});
