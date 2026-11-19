package com.miguia.backendapi.controller;

import java.time.LocalDate;
import java.util.List;

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

import com.miguia.backendapi.dto.ActividadRequest;
import com.miguia.backendapi.model.Actividad;
import com.miguia.backendapi.service.ActividadService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/actividades")
public class ActividadController {
    private final ActividadService servicio;

    public ActividadController(ActividadService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<Actividad> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return servicio.listar(desde, hasta);
    }

    @GetMapping("/{id}")
    public Actividad obtener(@PathVariable Long id) {
        return servicio.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Actividad> crear(@Valid @RequestBody ActividadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicio.crear(request));
    }

    @PutMapping("/{id}")
    public Actividad editar(@PathVariable Long id, @Valid @RequestBody ActividadRequest request) {
        return servicio.editar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
