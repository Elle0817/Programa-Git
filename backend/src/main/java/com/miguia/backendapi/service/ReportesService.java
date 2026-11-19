package com.miguia.backendapi.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.model.Servicio;
import com.miguia.backendapi.repository.CategoriaCostoRepository;
import com.miguia.backendapi.repository.ClienteRepository;
import com.miguia.backendapi.repository.CostoRepository;
import com.miguia.backendapi.repository.ReservaRepository;
import com.miguia.backendapi.repository.ServicioRepository;

@Service
public class ReportesService {
    private final ClienteRepository clientes;
    private final ServicioRepository servicios;
    private final ReservaRepository reservas;
    private final CostoRepository costos;
    private final CategoriaCostoRepository categorias;
    private final NegocioActivoService negocioActivo;

    public ReportesService(ClienteRepository clientes, ServicioRepository servicios,
            ReservaRepository reservas, CostoRepository costos,
            CategoriaCostoRepository categorias, NegocioActivoService negocioActivo) {
        this.clientes = clientes;
        this.servicios = servicios;
        this.reservas = reservas;
        this.costos = costos;
        this.categorias = categorias;
        this.negocioActivo = negocioActivo;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resumen(LocalDate desde, LocalDate hasta) {
        Long negocio = negocioActivo.requerirId();
        LocalDate hoy = LocalDate.now();
        if (hasta == null) hasta = hoy;
        if (desde == null) desde = hasta.withDayOfMonth(1);
        if (desde.isAfter(hasta)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "El periodo del reporte no es válido");
        LocalDate finExclusivo = hasta.plusDays(1);
        LocalDateTime inicioFechaHora = desde.atStartOfDay();
        LocalDateTime finFechaHora = finExclusivo.atStartOfDay();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("desde", desde);
        resultado.put("hasta", hasta);
        resultado.put("clientesRegistrados", clientes.countByIdNegocio(negocio));
        resultado.put("serviciosPublicados", servicios.countByIdNegocioAndEstado(negocio, "Publicado"));
        resultado.put("reservasPorEstado", estados(reservas.contarEstados(
                negocio, inicioFechaHora, finFechaHora)));
        resultado.put("serviciosMasReservados", topServicios(
                reservas.serviciosMasReservados(negocio, inicioFechaHora, finFechaHora, PageRequest.of(0, 8))));
        resultado.put("costosTotales", costos.sumar(negocio, desde, finExclusivo));
        resultado.put("costosPorCategoria", costosPorCategoria(
                costos.sumarPorCategoria(negocio, desde, finExclusivo), negocio));
        resultado.put("evolucionReservas", serie(reservas.reservasPorMes(
                negocio, inicioFechaHora, finFechaHora), false));
        resultado.put("evolucionCostos", serie(costos.costosPorMes(
                negocio, desde, finExclusivo), true));
        resultado.put("ingresosDisponibles", false);
        resultado.put("ingresos", null);
        resultado.put("balanceNeto", null);
        return resultado;
    }

    private List<Map<String, Object>> estados(List<Object[]> filas) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Object[] fila : filas) {
            resultado.add(Map.of("estado", fila[0], "cantidad", ((Number) fila[1]).longValue()));
        }
        return resultado;
    }

    private List<Map<String, Object>> topServicios(List<Object[]> filas) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Object[] fila : filas) {
            Long id = ((Number) fila[0]).longValue();
            Servicio s = servicios.findById(id).orElse(null);
            resultado.add(Map.of("idServicio", id, "nombre", s == null ? "Servicio no disponible" : s.getNombre(),
                    "reservas", ((Number) fila[1]).longValue()));
        }
        return resultado;
    }

    private List<Map<String, Object>> costosPorCategoria(List<Object[]> filas, Long negocio) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Object[] fila : filas) {
            Integer id = fila[0] == null ? null : ((Number) fila[0]).intValue();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("idCategoriaCosto", id);
            item.put("categoria", categorias.nombre(id, negocio));
            item.put("total", (BigDecimal) fila[1]);
            resultado.add(item);
        }
        return resultado;
    }

    private List<Map<String, Object>> serie(List<Object[]> filas, boolean monetaria) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Object[] fila : filas) {
            Map<String, Object> punto = new LinkedHashMap<>();
            punto.put("periodo", fila[0].toString());
            punto.put(monetaria ? "total" : "cantidad", fila[1]);
            resultado.add(punto);
        }
        return resultado;
    }
}
