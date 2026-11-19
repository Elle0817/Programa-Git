package com.miguia.backendapi.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ActividadRequest(
        @NotBlank @Size(max = 180) String titulo,
        @Size(max = 10000) String descripcion,
        @NotNull LocalDateTime fechaInicio,
        LocalDateTime fechaFin,
        String tipo,
        String estado) {
}
