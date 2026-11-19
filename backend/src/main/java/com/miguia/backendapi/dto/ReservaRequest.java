package com.miguia.backendapi.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ReservaRequest(
        @NotNull Long idCliente,
        @NotNull Long idServicio,
        @NotNull LocalDateTime fechaReserva,
        @NotNull @Positive Integer cantidadPersonas,
        @Size(max = 5000) String observaciones) { }
