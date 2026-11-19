package com.miguia.backendapi.service;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.dto.CategoriaCostoResponse;
import com.miguia.backendapi.dto.CostoRequest;
import com.miguia.backendapi.model.Costo;
import com.miguia.backendapi.repository.CategoriaCostoRepository;
import com.miguia.backendapi.repository.CostoRepository;

@Service
public class CostoService {
    private final CostoRepository costos;
    private final CategoriaCostoRepository categorias;
    private final NegocioActivoService negocioActivo;

    public CostoService(CostoRepository costos, CategoriaCostoRepository categorias,
            NegocioActivoService negocioActivo) {
        this.costos = costos;
        this.categorias = categorias;
        this.negocioActivo = negocioActivo;
    }

    @Transactional(readOnly = true)
    public List<Costo> listar(LocalDate desde, LocalDate hasta, Integer categoria, String q) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El periodo no es válido");
        }
        return costos.buscar(negocioActivo.requerirId(), desde, hasta, categoria,
                q == null || q.isBlank() ? null : q.trim());
    }

    @Transactional(readOnly = true)
    public Costo obtener(Long id) { return buscar(id); }

    @Transactional(readOnly = true)
    public BigDecimal total(LocalDate desde, LocalDate hasta, Integer categoria, String q) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El periodo no es válido");
        }
        return costos.sumarFiltrado(negocioActivo.requerirId(), desde, hasta, categoria,
                q == null || q.isBlank() ? null : q.trim());
    }

    @Transactional
    public Costo crear(CostoRequest datos) {
        Long negocio = negocioActivo.requerirId();
        validarCategoria(datos.idCategoriaCosto(), negocio);
        Costo costo = new Costo();
        costo.setIdNegocio(negocio);
        aplicar(costo, datos);
        return costos.saveAndFlush(costo);
    }

    @Transactional
    public Costo editar(Long id, CostoRequest datos) {
        Costo actual = buscar(id);
        validarCategoria(datos.idCategoriaCosto(), actual.getIdNegocio());
        aplicar(actual, datos);
        return costos.saveAndFlush(actual);
    }

    @Transactional
    public void eliminar(Long id) {
        Costo costo = buscar(id);
        costos.delete(costo);
        costos.flush();
    }

    @Transactional(readOnly = true)
    public List<CategoriaCostoResponse> categorias() {
        Long negocio = negocioActivo.requerirId();
        return categorias.listar(negocio).stream()
                .map(row -> new CategoriaCostoResponse(((Number) row[0]).intValue(), (String) row[1]))
                .toList();
    }

    private Costo buscar(Long id) {
        Costo costo = costos.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Costo no encontrado"));
        if (!negocioActivo.requerirId().equals(costo.getIdNegocio())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Costo no encontrado");
        }
        return costo;
    }

    private void validarCategoria(Integer categoria, Long negocio) {
        if (categoria != null && !categorias.existeEnNegocio(categoria, negocio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La categoría de costo no existe para el negocio activo");
        }
    }

    private void aplicar(Costo costo, CostoRequest datos) {
        costo.setIdCategoriaCosto(datos.idCategoriaCosto());
        costo.setConcepto(datos.concepto().trim());
        costo.setValor(datos.valor());
        costo.setFechaCosto(datos.fechaCosto());
        costo.setObservaciones(datos.observaciones() == null || datos.observaciones().isBlank()
                ? null : datos.observaciones().trim());
    }
}
