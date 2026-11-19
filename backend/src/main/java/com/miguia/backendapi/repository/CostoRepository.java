package com.miguia.backendapi.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.miguia.backendapi.model.Costo;

public interface CostoRepository extends JpaRepository<Costo, Long> {
    @Query("select c from Costo c where c.idNegocio = :negocio " +
           "and (:desde is null or c.fechaCosto >= :desde) " +
           "and (:hasta is null or c.fechaCosto <= :hasta) " +
           "and (:categoria is null or c.idCategoriaCosto = :categoria) " +
           "and (:texto is null or lower(c.concepto) like lower(concat('%', :texto, '%'))) " +
           "order by c.fechaCosto desc, c.idCosto desc")
    List<Costo> buscar(@Param("negocio") Long negocio, @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta, @Param("categoria") Integer categoria,
            @Param("texto") String texto);

    @Query("select coalesce(sum(c.valor), 0) from Costo c where c.idNegocio = :negocio " +
           "and c.fechaCosto >= :desde and c.fechaCosto < :hasta")
    BigDecimal sumar(@Param("negocio") Long negocio,
            @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("select coalesce(sum(c.valor), 0) from Costo c where c.idNegocio = :negocio " +
           "and (:desde is null or c.fechaCosto >= :desde) " +
           "and (:hasta is null or c.fechaCosto <= :hasta) " +
           "and (:categoria is null or c.idCategoriaCosto = :categoria) " +
           "and (:texto is null or lower(c.concepto) like lower(concat('%', :texto, '%'))) ")
    BigDecimal sumarFiltrado(@Param("negocio") Long negocio, @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta, @Param("categoria") Integer categoria,
            @Param("texto") String texto);

    @Query("select c.idCategoriaCosto, coalesce(sum(c.valor), 0) from Costo c " +
           "where c.idNegocio = :negocio and c.fechaCosto >= :desde and c.fechaCosto < :hasta " +
           "group by c.idCategoriaCosto")
    List<Object[]> sumarPorCategoria(@Param("negocio") Long negocio,
            @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query(value = "SELECT DATE_FORMAT(fecha_costo,'%Y-%m') AS periodo, SUM(valor) AS total " +
            "FROM costos WHERE id_negocio=:negocio AND fecha_costo>=:desde " +
            "AND fecha_costo<:hasta GROUP BY DATE_FORMAT(fecha_costo,'%Y-%m') ORDER BY periodo",
            nativeQuery = true)
    List<Object[]> costosPorMes(@Param("negocio") Long negocio,
            @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
