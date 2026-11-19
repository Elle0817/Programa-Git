
package com.miguia.backendapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.miguia.backendapi.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findByIdNegocio(Long idNegocio);

    long countByIdNegocio(Long idNegocio);

    @Query(value = "SELECT COUNT(*) FROM negocios WHERE id_negocio = :id", nativeQuery = true)
    Long contarNegocio(@Param("id") Long id);

    default boolean existeNegocio(Long id) {
        return contarNegocio(id) > 0;
    }
}
