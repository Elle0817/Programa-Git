package com.miguia.backendapi.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.miguia.backendapi.model.Reserva;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    @Query("select r from Reserva r where r.idNegocio = :negocio " +
           "and (:desde is null or r.fechaReserva >= :desde) " +
           "and (:hasta is null or r.fechaReserva < :hasta) " +
           "and (:estado is null or r.estado = :estado) " +
           "and (:cliente is null or r.idCliente = :cliente) " +
           "and (:servicio is null or r.idServicio = :servicio) " +
           "and (:texto is null or lower(r.codigo) like lower(concat('%', :texto, '%')) " +
           "or exists (select c from Cliente c where c.idCliente = r.idCliente " +
           "and lower(c.nombre) like lower(concat('%', :texto, '%'))) " +
           "or exists (select s from Servicio s where s.idServicio = r.idServicio " +
           "and lower(s.nombre) like lower(concat('%', :texto, '%')))) " +
           "order by r.fechaReserva")
    List<Reserva> buscar(@Param("negocio") Long negocio,
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta,
            @Param("estado") String estado, @Param("cliente") Long cliente,
            @Param("servicio") Long servicio, @Param("texto") String texto);

    boolean existsByCodigo(String codigo);

    @Query("select r from Reserva r where r.idNegocio = :negocio and r.idServicio = :servicio " +
           "and r.estado in ('Pendiente','Confirmada') and r.fechaReserva >= :desde " +
           "and r.fechaReserva <= :hasta order by r.fechaReserva")
    List<Reserva> paraValidarDisponibilidad(@Param("negocio") Long negocio,
            @Param("servicio") Long servicio, @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    @Query("select r.estado, count(r) from Reserva r where r.idNegocio = :negocio " +
           "and r.fechaReserva >= :desde and r.fechaReserva < :hasta group by r.estado")
    List<Object[]> contarEstados(@Param("negocio") Long negocio,
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("select r.idServicio, count(r) from Reserva r where r.idNegocio = :negocio " +
           "and r.estado <> 'Cancelada' and r.fechaReserva >= :desde and r.fechaReserva < :hasta " +
           "group by r.idServicio order by count(r) desc")
    List<Object[]> serviciosMasReservados(@Param("negocio") Long negocio,
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta,
            Pageable pageable);

    @Query(value = "SELECT DATE_FORMAT(fecha_reserva,'%Y-%m') AS periodo, COUNT(*) AS cantidad " +
            "FROM reservas WHERE id_negocio=:negocio AND fecha_reserva>=:desde " +
            "AND fecha_reserva<:hasta GROUP BY DATE_FORMAT(fecha_reserva,'%Y-%m') ORDER BY periodo",
            nativeQuery = true)
    List<Object[]> reservasPorMes(@Param("negocio") Long negocio,
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
