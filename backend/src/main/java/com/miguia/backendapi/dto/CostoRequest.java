package com.miguia.backendapi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;

public record CostoRequest(
        Integer idCategoriaCosto,
        @NotBlank @Size(max = 180) String concepto,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal valor,
        @NotNull LocalDate fechaCosto,
        @Size(max = 5000) String observaciones) { }
