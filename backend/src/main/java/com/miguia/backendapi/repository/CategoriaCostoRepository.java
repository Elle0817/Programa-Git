package com.miguia.backendapi.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;

@Repository
public class CategoriaCostoRepository {
    private final EntityManager entityManager;

    public CategoriaCostoRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public boolean existeEnNegocio(Integer id, Long negocio) {
        Number n = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM categorias_costos " +
                "WHERE id_categoria_costo=:id AND id_negocio=:negocio")
                .setParameter("id", id).setParameter("negocio", negocio).getSingleResult();
        return n.longValue() > 0;
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> listar(Long negocio) {
        return entityManager.createNativeQuery(
                "SELECT id_categoria_costo, nombre FROM categorias_costos " +
                "WHERE id_negocio=:negocio ORDER BY nombre")
                .setParameter("negocio", negocio).getResultList();
    }

    public String nombre(Integer id, Long negocio) {
        if (id == null) return "Sin categoría";
        @SuppressWarnings("unchecked")
        List<String> nombres = entityManager.createNativeQuery(
                "SELECT nombre FROM categorias_costos WHERE id_categoria_costo=:id " +
                "AND id_negocio=:negocio")
                .setParameter("id", id).setParameter("negocio", negocio).getResultList();
        return nombres.isEmpty() ? "Sin categoría" : nombres.get(0);
    }
}
