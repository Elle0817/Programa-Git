package com.miguia.backendapi.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.miguia.backendapi.model.Actividad;

public interface ActividadRepository extends JpaRepository<Actividad, Long> {
    List<Actividad> findByIdNegocioAndFechaInicioGreaterThanEqualAndFechaInicioLessThanOrderByFechaInicio(
            Long idNegocio, LocalDateTime desde, LocalDateTime hasta);

    Optional<Actividad> findByIdActividadAndIdNegocio(Long idActividad, Long idNegocio);
}
