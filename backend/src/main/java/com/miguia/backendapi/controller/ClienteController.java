
package com.miguia.backendapi.controller;

import java.util.List;

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

import com.miguia.backendapi.model.Cliente;
import com.miguia.backendapi.repository.ClienteRepository;
import com.miguia.backendapi.service.NegocioActivoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final NegocioActivoService negocioActivo;

    public ClienteController(ClienteRepository clienteRepository, NegocioActivoService negocioActivo) {
        this.clienteRepository = clienteRepository;
        this.negocioActivo = negocioActivo;
    }

    @GetMapping
    public List<Cliente> listarClientes(@RequestParam(required = false) Long idNegocio) {
        Long idActivo = negocioActivo.requerirId();
        validarAmbitoSolicitado(idNegocio, idActivo);
        return clienteRepository.findByIdNegocio(idActivo);
    }

    @GetMapping("/{id}")
    public Cliente obtenerCliente(@PathVariable Long id,
            @RequestParam(required = false) Long idNegocio) {
        Cliente cliente = buscar(id);
        Long idActivo = negocioActivo.requerirId();
        validarAmbitoSolicitado(idNegocio, idActivo);
        validarPropietario(cliente, idActivo);
        return cliente;
    }

    @PostMapping
    public ResponseEntity<Cliente> crearCliente(
            @Valid @RequestBody Cliente cliente) {

        cliente.setNombre(cliente.getNombre().trim());
        Long idActivo = negocioActivo.requerirId();
        if (cliente.getIdNegocio() != null && !cliente.getIdNegocio().equals(idActivo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No se puede asociar un cliente a otro negocio");
        }
        cliente.setIdNegocio(idActivo);

        Cliente nuevoCliente = clienteRepository.save(cliente);

        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoCliente);
    }

    @PutMapping("/{id}")
    public Cliente actualizarCliente(
            @PathVariable Long id,
            @RequestParam(required = false) Long idNegocio,
            @Valid @RequestBody Cliente datos) {

        Cliente cliente = buscar(id);
        Long idActivo = negocioActivo.requerirId();
        validarAmbitoSolicitado(idNegocio, idActivo);
        validarPropietario(cliente, idActivo);
        if (datos.getIdNegocio() != null && !idActivo.equals(datos.getIdNegocio())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No se puede cambiar el negocio asociado al cliente");
        }

        cliente.setNombre(datos.getNombre().trim());
        cliente.setCorreo(datos.getCorreo());
        cliente.setTelefono(datos.getTelefono());
        cliente.setObservaciones(datos.getObservaciones());

        return clienteRepository.save(cliente);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCliente(@PathVariable Long id,
            @RequestParam(required = false) Long idNegocio) {
        Cliente cliente = buscar(id);
        Long idActivo = negocioActivo.requerirId();
        validarAmbitoSolicitado(idNegocio, idActivo);
        validarPropietario(cliente, idActivo);
        clienteRepository.delete(cliente);

        return ResponseEntity.noContent().build();
    }

    private Cliente buscar(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cliente no encontrado"));
    }

    private void validarAmbitoSolicitado(Long solicitado, Long activo) {
        if (solicitado != null && !solicitado.equals(activo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "El negocio solicitado no corresponde al negocio activo");
        }
    }

    private void validarPropietario(Cliente cliente, Long idActivo) {
        if (!idActivo.equals(cliente.getIdNegocio())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente no encontrado para el negocio activo");
        }
    }
}
