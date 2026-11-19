package com.miguia.backendapi.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguia.backendapi.dto.CategoriaServicioResponse;
import com.miguia.backendapi.repository.CategoriaServicioRepository;
import com.miguia.backendapi.service.NegocioActivoService;

@RestController
@RequestMapping("/api/categorias-servicios")
public class CategoriaServicioController {
    private final CategoriaServicioRepository categorias;
    private final NegocioActivoService negocioActivo;

    public CategoriaServicioController(CategoriaServicioRepository categorias,
            NegocioActivoService negocioActivo) {
        this.categorias = categorias;
        this.negocioActivo = negocioActivo;
    }

    @GetMapping
    public List<CategoriaServicioResponse> listar() {
        return categorias.listar(negocioActivo.requerirId()).stream()
                .map(row -> new CategoriaServicioResponse(((Number) row[0]).intValue(), (String) row[1]))
                .toList();
    }
}
