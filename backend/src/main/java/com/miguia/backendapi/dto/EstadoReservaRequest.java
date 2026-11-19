package com.miguia.backendapi.dto;

import jakarta.validation.constraints.NotBlank;

public record EstadoReservaRequest(@NotBlank String estado) { }
