package com.miguia.backendapi.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;

@Repository
public class NegocioRepository {
    private final EntityManager entityManager;

    public NegocioRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<Long> listarActivos() {
        @SuppressWarnings("unchecked")
        List<Number> rows = entityManager.createNativeQuery(
                "SELECT id_negocio FROM negocios WHERE estado = 'Activo' ORDER BY id_negocio")
                .getResultList();
        return rows.stream().map(Number::longValue).toList();
    }

    public long contarActivo(Long id) {
        Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM negocios WHERE id_negocio = :id AND estado = 'Activo'")
                .setParameter("id", id).getSingleResult();
        return count.longValue();
    }
}
