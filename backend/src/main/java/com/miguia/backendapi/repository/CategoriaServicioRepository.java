package com.miguia.backendapi.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;

@Repository
public class CategoriaServicioRepository {
    private final EntityManager entityManager;

    public CategoriaServicioRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> listar(Long negocio) {
        return entityManager.createNativeQuery(
                "SELECT id_categoria, nombre FROM categorias_servicios " +
                "WHERE id_negocio=:negocio ORDER BY nombre")
                .setParameter("negocio", negocio).getResultList();
    }
}
