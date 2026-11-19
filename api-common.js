"use strict";
(() => {
    // All modules use the single local Spring Boot API endpoint.
    const API = "http://localhost:8080";
    let contextoPromise;

    async function request(path, options = {}) {
        let response;
        const url = API + path;
        const method = (options.method || "GET").toUpperCase();
        try {
            response = await fetch(url, {
                ...options,
                headers: {
                    ...(options.body ? { "Content-Type": "application/json" } : {}),
                    ...(options.headers || {})
                }
            });
        } catch (cause) {
            const detail = cause instanceof Error ? cause.message : String(cause);
            throw new Error(
                `No se pudo completar ${method} ${url} desde ${window.location.origin}. ` +
                `El navegador no pudo leer una respuesta; verifica la conexión del backend y CORS para este origen. (${detail})`,
                { cause }
            );
        }
        if (!response.ok) {
            const text = await response.text();
            let message = "";
            try {
                const body = text ? JSON.parse(text) : null;
                message = body?.detail || body?.message || body?.title || "";
            } catch (cause) {
                if (text) message = text;
                else if (cause instanceof Error) message = cause.message;
            }
            const error = new Error(`HTTP ${response.status} ${response.statusText}: ${message || "respuesta sin detalle"}`);
            error.status = response.status;
            error.url = url;
            error.responseBody = text;
            throw error;
        }
        if (response.status === 204) return null;
        try {
            return await response.json();
        } catch (cause) {
            throw new Error(`La respuesta de ${method} ${url} no contiene JSON válido: ${cause.message}`, { cause });
        }
    }

    function negocioActivo() {
        if (!contextoPromise) {
            contextoPromise = request("/api/contexto/negocio-activo").catch(error => {
                contextoPromise = null;
                throw error;
            });
        }
        return contextoPromise;
    }

    function mostrarMensaje(message, kind = "") {
        const el = document.querySelector("#mensaje-pagina");
        if (!el) return;
        el.textContent = message || "";
        el.dataset.tipo = kind;
    }

    function dinero(value) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency", currency: "COP", maximumFractionDigits: 2
        }).format(Number(value || 0));
    }

    function fechaHora(value) {
        return value ? new Date(value).toLocaleString("es-CO", {
            dateStyle: "short", timeStyle: "short"
        }) : "—";
    }

    function fecha(value) {
        return value ? new Date(value + "T12:00:00").toLocaleDateString("es-CO") : "—";
    }

    function query(params) {
        const values = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== "") values.set(key, value);
        });
        const text = values.toString();
        return text ? "?" + text : "";
    }

    window.MGT = { API, request, negocioActivo, mostrarMensaje, dinero, fechaHora, fecha, query };
})();
