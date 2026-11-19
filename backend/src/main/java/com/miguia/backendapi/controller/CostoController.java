package com.miguia.backendapi.controller;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.miguia.backendapi.dto.CategoriaCostoResponse;
import com.miguia.backendapi.dto.CostoRequest;
import com.miguia.backendapi.model.Costo;
import com.miguia.backendapi.service.CostoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/costos")
public class CostoController {
    private final CostoService servicio;

    public CostoController(CostoService servicio) { this.servicio = servicio; }

    @GetMapping
    public List<Costo> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer idCategoriaCosto,
            @RequestParam(required = false) String q) {
        return servicio.listar(desde, hasta, idCategoriaCosto, q);
    }

    @GetMapping("/resumen")
    public Map<String, BigDecimal> resumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer idCategoriaCosto,
            @RequestParam(required = false) String q) {
        return Map.of("total", servicio.total(desde, hasta, idCategoriaCosto, q));
    }

    @GetMapping("/{id}")
    public Costo obtener(@PathVariable Long id) { return servicio.obtener(id); }

    @PostMapping
    public ResponseEntity<Costo> crear(@Valid @RequestBody CostoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicio.crear(request));
    }

    @PutMapping("/{id}")
    public Costo editar(@PathVariable Long id, @Valid @RequestBody CostoRequest request) {
        return servicio.editar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    public List<CategoriaCostoResponse> categorias() { return servicio.categorias(); }
}
