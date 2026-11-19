package com.miguia.backendapi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.dto.ReservaRequest;
import com.miguia.backendapi.model.Cliente;
import com.miguia.backendapi.model.Reserva;
import com.miguia.backendapi.model.Servicio;
import com.miguia.backendapi.repository.ClienteRepository;
import com.miguia.backendapi.repository.ReservaRepository;
import com.miguia.backendapi.repository.ServicioRepository;

class ReservaServiceTest {
    private ReservaRepository reservas;
    private ClienteRepository clientes;
    private ServicioRepository servicios;
    private NegocioActivoService negocioActivo;
    private ReservaService service;
    private Cliente cliente;
    private Servicio servicio;

    @BeforeEach
    void preparar() {
        reservas = mock(ReservaRepository.class);
        clientes = mock(ClienteRepository.class);
        servicios = mock(ServicioRepository.class);
        negocioActivo = mock(NegocioActivoService.class);
        when(negocioActivo.requerirId()).thenReturn(10L);
        service = new ReservaService(reservas, clientes, servicios, negocioActivo);
        cliente = new Cliente();
        cliente.setIdNegocio(10L);
        cliente.setNombre("Ana");
        servicio = new Servicio();
        servicio.setIdNegocio(10L);
        servicio.setNombre("Tour");
        servicio.setEstado("Publicado");
        servicio.setPrecio(BigDecimal.TEN);
        servicio.setCupos(4);
        when(clientes.findById(1L)).thenReturn(Optional.of(cliente));
        when(servicios.findById(2L)).thenReturn(Optional.of(servicio));
    }

    @Test
    void crearConFechaPasadaDevuelve400() {
        ReservaRequest request = new ReservaRequest(1L, 2L, LocalDateTime.now().minusDays(1), 1, null);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> service.crear(request)).getStatusCode());
        verify(reservas, never()).saveAndFlush(any());
    }

    @Test
    void editarSinCambiarFechaAntiguaNoFallaPorFecha() {
        LocalDateTime antigua = LocalDateTime.now().minusDays(3).withNano(0);
        Reserva existente = new Reserva();
        existente.setIdNegocio(10L);
        existente.setIdCliente(1L);
        existente.setIdServicio(2L);
        existente.setFechaReserva(antigua);
        existente.setCantidadPersonas(1);
        existente.setPrecioUnitario(BigDecimal.TEN);
        existente.setEstado("Pendiente");
        when(reservas.findById(3L)).thenReturn(Optional.of(existente));
        when(reservas.paraValidarDisponibilidad(eq(10L), eq(null), any(), any()))
                .thenReturn(List.of());
        when(reservas.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        ReservaRequest request = new ReservaRequest(1L, 2L, antigua, 1, "Nota actualizada");

        assertDoesNotThrow(() -> service.editar(3L, request));
        assertEquals("Nota actualizada", existente.getObservaciones());
    }
}
