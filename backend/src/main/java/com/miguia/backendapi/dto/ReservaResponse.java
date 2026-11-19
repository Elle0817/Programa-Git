package com.miguia.backendapi.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ReservaResponse(Long idReserva, String codigo, Long idNegocio,
        Long idCliente, String nombreCliente, Long idServicio, String nombreServicio,
        LocalDateTime fechaReserva, Integer cantidadPersonas, BigDecimal precioUnitario,
        BigDecimal total, String estado, String observaciones) { }
