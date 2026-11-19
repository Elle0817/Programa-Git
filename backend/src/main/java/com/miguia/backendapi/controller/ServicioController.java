package com.miguia.backendapi.controller;

import java.util.List;
import java.util.Set;

import jakarta.validation.Valid;

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
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.model.Servicio;
import com.miguia.backendapi.repository.ServicioRepository;
import com.miguia.backendapi.service.NegocioActivoService;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private static final Set<String> ESTADOS =
            Set.of("Publicado", "Borrador", "Inactivo");

    private final ServicioRepository repository;
    private final NegocioActivoService negocioActivo;

    public ServicioController(ServicioRepository repository, NegocioActivoService negocioActivo) {
        this.repository = repository;
        this.negocioActivo = negocioActivo;
    }

    @GetMapping
    public List<Servicio> listar(
            @RequestParam(required = false) Long idNegocio) {

        Long idActivo = negocioActivo.requerirId();
        validarAmbitoSolicitado(idNegocio, idActivo);
        return repository.findByIdNegocio(idActivo);
    }

    @GetMapping("/{id}")
    public Servicio obtener(@PathVariable Long id) {
        Servicio servicio = buscar(id);
        validarPropietario(servicio, negocioActivo.requerirId());
        return servicio;
    }

    @PostMapping
    public ResponseEntity<Servicio> crear(
            @Valid @RequestBody Servicio datos) {

        Long idActivo = negocioActivo.requerirId();
        validarNegocioEnCuerpo(datos.getIdNegocio(), idActivo, false);
        datos.setIdNegocio(idActivo);
        validarReferencias(datos, idActivo);
        normalizar(datos);

        Servicio guardado = repository.saveAndFlush(datos);

        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @PutMapping("/{id}")
    public Servicio actualizar(
            @PathVariable Long id,
            @Valid @RequestBody Servicio datos) {

        Servicio actual = buscar(id);
        Long idActivo = negocioActivo.requerirId();
        validarPropietario(actual, idActivo);
        validarNegocioEnCuerpo(datos.getIdNegocio(), idActivo, true);

        datos.setIdNegocio(idActivo);
        validarReferencias(datos, idActivo);
        normalizar(datos);

        actual.setIdCategoria(datos.getIdCategoria());
        actual.setNombre(datos.getNombre());
        actual.setDescripcion(datos.getDescripcion());
        actual.setPrecio(datos.getPrecio());
        actual.setDuracionMinutos(datos.getDuracionMinutos());
        actual.setCupos(datos.getCupos());
        actual.setEstado(datos.getEstado());

        return repository.saveAndFlush(actual);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        Servicio servicio = buscar(id);
        validarPropietario(servicio, negocioActivo.requerirId());
        repository.delete(servicio);
        repository.flush();

        return ResponseEntity.noContent().build();
    }

    private Servicio buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Servicio no encontrado"));
    }

    private void validarReferencias(Servicio servicio, Long idNegocio) {
        if (servicio.getIdCategoria() != null
                && !repository.existeCategoriaDelNegocio(
                        servicio.getIdCategoria(), idNegocio)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La categoría no existe o pertenece a otro negocio");
        }

        if (servicio.getEstado() == null
                || !ESTADOS.contains(servicio.getEstado())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El estado del servicio no es válido");
        }
    }

    private void validarAmbitoSolicitado(Long solicitado, Long activo) {
        if (solicitado != null && !solicitado.equals(activo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "El negocio solicitado no corresponde al negocio activo");
        }
    }

    private void validarNegocioEnCuerpo(Long solicitado, Long activo, boolean actualizar) {
        if (solicitado != null && !solicitado.equals(activo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    actualizar ? "No se puede cambiar el negocio asociado al servicio"
                            : "No se puede asociar un servicio a otro negocio");
        }
    }

    private void validarPropietario(Servicio servicio, Long idActivo) {
        if (!idActivo.equals(servicio.getIdNegocio())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado");
        }
    }

    private void normalizar(Servicio servicio) {
        servicio.setNombre(servicio.getNombre().trim());

        if (servicio.getDescripcion() != null) {
            servicio.setDescripcion(servicio.getDescripcion().trim());
        }
    }
}
