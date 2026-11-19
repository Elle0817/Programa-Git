package com.miguia.backendapi.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.dto.EstadoReservaRequest;
import com.miguia.backendapi.dto.ReservaRequest;
import com.miguia.backendapi.dto.ReservaResponse;
import com.miguia.backendapi.service.ReservaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {
    private final ReservaService servicio;

    public ReservaController(ReservaService servicio) { this.servicio = servicio; }

    @GetMapping
    public List<ReservaResponse> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long idCliente,
            @RequestParam(required = false) Long idServicio,
            @RequestParam(required = false) String q) {
        LocalDateTime inicio = desde == null ? null : desde.atStartOfDay();
        LocalDateTime fin = hasta == null ? null : hasta.plusDays(1).atStartOfDay();
        return servicio.listar(inicio, fin, estado, idCliente, idServicio, q);
    }

    @GetMapping("/{id}")
    public ReservaResponse obtener(@PathVariable Long id) { return servicio.obtener(id); }

    @PostMapping
    public ResponseEntity<ReservaResponse> crear(@Valid @RequestBody ReservaRequest request) {
        ReservaResponse creada = servicio.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    public ReservaResponse editar(@PathVariable Long id,
            @Valid @RequestBody ReservaRequest request) {
        return servicio.editar(id, request);
    }

    @PatchMapping("/{id}/estado")
    public ReservaResponse cambiarEstado(@PathVariable Long id,
            @Valid @RequestBody EstadoReservaRequest request) {
        if (!List.of("Pendiente", "Confirmada", "Completada", "Cancelada").contains(request.estado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de reserva no válido");
        }
        return servicio.cambiarEstado(id, request.estado());
    }

    @PatchMapping("/{id}/cancelar")
    public ReservaResponse cancelar(@PathVariable Long id) {
        return servicio.cambiarEstado(id, "Cancelada");
    }
}
