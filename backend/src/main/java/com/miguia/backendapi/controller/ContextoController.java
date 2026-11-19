package com.miguia.backendapi.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miguia.backendapi.service.NegocioActivoService;

@RestController
public class ContextoController {

    private final NegocioActivoService negocioActivo;

    public ContextoController(NegocioActivoService negocioActivo) {
        this.negocioActivo = negocioActivo;
    }

    @GetMapping("/api/contexto/negocio-activo")
    public Map<String, Long> negocioActivo() {
        return Map.of("idNegocio", negocioActivo.requerirId());
    }
}
