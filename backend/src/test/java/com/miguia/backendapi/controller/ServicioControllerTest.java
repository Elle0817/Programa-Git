package com.miguia.backendapi.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.model.Servicio;
import com.miguia.backendapi.repository.ServicioRepository;
import com.miguia.backendapi.service.NegocioActivoService;

class ServicioControllerTest {
    private ServicioRepository repository;
    private NegocioActivoService negocioActivo;
    private ServicioController controller;
    private Servicio ajeno;

    @BeforeEach
    void preparar() {
        repository = mock(ServicioRepository.class);
        negocioActivo = mock(NegocioActivoService.class);
        when(negocioActivo.requerirId()).thenReturn(10L);
        controller = new ServicioController(repository, negocioActivo);
        ajeno = servicio(20L);
    }

    @Test
    void listarSiempreFiltraPorNegocioActivo() {
        when(repository.findByIdNegocio(10L)).thenReturn(List.of());
        assertTrue(controller.listar(null).isEmpty());
        verify(repository).findByIdNegocio(10L);
        verify(repository, never()).findAll();
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> controller.listar(20L)).getStatusCode());
    }

    @Test
    void operacionesSobreServicioAjenoDevuelven404() {
        when(repository.findById(1L)).thenReturn(Optional.of(ajeno));
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> controller.obtener(1L)).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> controller.actualizar(1L, servicio(10L))).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> controller.eliminar(1L)).getStatusCode());
        verify(repository, never()).delete(any());
    }

    @Test
    void actualizarConservaNegocioExistente() {
        Servicio existente = servicio(10L);
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.existeCategoriaDelNegocio(null, 10L)).thenReturn(true);
        when(repository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        Servicio entrada = servicio(10L);
        entrada.setNombre(" Actualizado ");

        Servicio resultado = controller.actualizar(1L, entrada);

        assertEquals(10L, resultado.getIdNegocio());
        assertEquals("Actualizado", resultado.getNombre());
    }

    @Test
    void crearConNegocioDistintoDevuelve403() {
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> controller.crear(servicio(20L))).getStatusCode());
        verify(repository, never()).saveAndFlush(any());
    }

    private Servicio servicio(Long negocio) {
        Servicio servicio = new Servicio();
        servicio.setIdNegocio(negocio);
        servicio.setNombre("Tour");
        servicio.setPrecio(BigDecimal.TEN);
        servicio.setCupos(2);
        servicio.setEstado("Publicado");
        return servicio;
    }
}
