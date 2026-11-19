package com.miguia.backendapi.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.dto.ActividadRequest;
import com.miguia.backendapi.model.Actividad;
import com.miguia.backendapi.repository.ActividadRepository;

@Service
public class ActividadService {
    private static final Set<String> TIPOS = Set.of("Evento", "Actividad", "Recordatorio");
    private static final Set<String> ESTADOS = Set.of("Programada", "Realizada", "Cancelada");

    private final ActividadRepository actividades;
    private final NegocioActivoService negocioActivo;

    public ActividadService(ActividadRepository actividades, NegocioActivoService negocioActivo) {
        this.actividades = actividades;
        this.negocioActivo = negocioActivo;
    }

    @Transactional(readOnly = true)
    public List<Actividad> listar(LocalDate desde, LocalDate hasta) {
        if (desde == null && hasta == null) {
            LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
            desde = inicioMes;
            hasta = inicioMes.plusMonths(1).minusDays(1);
        }
        if (desde == null) desde = hasta.withDayOfMonth(1);
        if (hasta == null) hasta = desde.withDayOfMonth(desde.lengthOfMonth());
        if (hasta.isBefore(desde)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha final no puede ser anterior a la fecha inicial");
        }
        return actividades.findByIdNegocioAndFechaInicioGreaterThanEqualAndFechaInicioLessThanOrderByFechaInicio(
                negocioActivo.requerirId(), desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay());
    }

    @Transactional(readOnly = true)
    public Actividad obtener(Long id) {
        return buscarActivo(id, negocioActivo.requerirId());
    }

    @Transactional
    public Actividad crear(ActividadRequest datos) {
        Long idNegocio = negocioActivo.requerirId();
        validar(datos);
        Actividad actividad = new Actividad();
        actividad.setIdNegocio(idNegocio);
        aplicar(actividad, datos, "Actividad", "Programada");
        return actividades.saveAndFlush(actividad);
    }

    @Transactional
    public Actividad editar(Long id, ActividadRequest datos) {
        Actividad actividad = buscarActivo(id, negocioActivo.requerirId());
        validar(datos);
        aplicar(actividad, datos, "Actividad", "Programada");
        return actividades.saveAndFlush(actividad);
    }

    @Transactional
    public void eliminar(Long id) {
        Actividad actividad = buscarActivo(id, negocioActivo.requerirId());
        actividades.delete(actividad);
        actividades.flush();
    }

    private Actividad buscarActivo(Long id, Long idNegocio) {
        return actividades.findByIdActividadAndIdNegocio(id, idNegocio)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Actividad no encontrada para el negocio activo"));
    }

    private void validar(ActividadRequest datos) {
        if (datos.fechaFin() != null && !datos.fechaFin().isAfter(datos.fechaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha y hora final debe ser posterior al inicio");
        }
        if (datos.tipo() != null && !TIPOS.contains(datos.tipo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de actividad no válido");
        }
        if (datos.estado() != null && !ESTADOS.contains(datos.estado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de actividad no válido");
        }
    }

    private void aplicar(Actividad actividad, ActividadRequest datos, String tipoDefault, String estadoDefault) {
        actividad.setTitulo(datos.titulo().trim());
        actividad.setDescripcion(datos.descripcion() == null || datos.descripcion().isBlank()
                ? null : datos.descripcion().trim());
        actividad.setFechaInicio(datos.fechaInicio().withNano(0));
        actividad.setFechaFin(datos.fechaFin() == null ? null : datos.fechaFin().withNano(0));
        actividad.setTipo(datos.tipo() == null ? tipoDefault : datos.tipo());
        actividad.setEstado(datos.estado() == null ? estadoDefault : datos.estado());
    }
}
