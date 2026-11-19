package com.miguia.backendapi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.repository.NegocioRepository;

@Service
public class NegocioActivoService {

    private final NegocioRepository repository;
    private final String negocioConfigurado;

    public NegocioActivoService(
            NegocioRepository repository,
            @Value("${mi-guia.negocio-activo-id:}") String negocioConfigurado) {
        this.repository = repository;
        this.negocioConfigurado = negocioConfigurado;
    }

    public Long requerirId() {
        final Long id;
        if (negocioConfigurado == null || negocioConfigurado.isBlank()) {
            var activos = repository.listarActivos();
            if (activos.size() != 1) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Define NEGOCIO_ACTIVO_ID porque no hay un único negocio activo");
            }
            id = activos.get(0);
        } else {
            try {
                id = Long.valueOf(negocioConfigurado.trim());
            } catch (RuntimeException ex) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "NEGOCIO_ACTIVO_ID debe ser un identificador numérico");
            }
        }
        if (id <= 0 || repository.contarActivo(id) == 0) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "NEGOCIO_ACTIVO_ID no corresponde a un negocio existente");
        }
        return id;
    }
}
