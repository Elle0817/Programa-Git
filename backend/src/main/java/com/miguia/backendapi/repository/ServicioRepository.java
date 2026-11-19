
package com.miguia.backendapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.miguia.backendapi.model.Servicio;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    List<Servicio> findByIdNegocio(Long idNegocio);

    long countByIdNegocioAndEstado(Long idNegocio, String estado);

    @Query(value = "SELECT COUNT(*) FROM negocios WHERE id_negocio = :id", nativeQuery = true)
    Long contarNegocio(@Param("id") Long id);

    default boolean existeNegocio(Long id) {
        return contarNegocio(id) > 0;
    }

    @Query(value = """
        SELECT COUNT(*)
        FROM categorias_servicios
        WHERE id_categoria = :categoria
          AND id_negocio = :negocio
        """, nativeQuery = true)
    Long contarCategoriaDelNegocio(
        @Param("categoria") Integer idCategoria,
        @Param("negocio") Long idNegocio
    );

    default boolean existeCategoriaDelNegocio(Integer idCategoria, Long idNegocio) {
        return contarCategoriaDelNegocio(idCategoria, idNegocio) > 0;
    }
}
