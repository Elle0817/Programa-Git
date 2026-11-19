package com.miguia.backendapi.config;

import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ManejadorErrores {
    private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> manejarEstado(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return respuesta(status, ex.getReason() == null ? "La solicitud no se pudo completar" : ex.getReason());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> manejarValidacion(MethodArgumentNotValidException ex) {
        String detalle = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return respuesta(HttpStatus.BAD_REQUEST, detalle.isBlank() ? "Revise los datos ingresados" : detalle);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> manejarJsonInvalido(HttpMessageNotReadableException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, "El contenido enviado no es válido. Revise el formato de los datos");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> manejarIntegridad(DataIntegrityViolationException ex) {
        return respuesta(HttpStatus.CONFLICT,
                "La operación viola una restricción de datos, por ejemplo registros relacionados");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> manejarError(Exception ex) {
        log.error("Error interno al procesar la solicitud", ex);
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno. Intente nuevamente");
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus status, String detalle) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(), "title", titulo(status), "detail", detalle));
    }

    private String titulo(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Solicitud incorrecta";
            case FORBIDDEN -> "Acceso denegado";
            case NOT_FOUND -> "No encontrado";
            case CONFLICT -> "Conflicto de datos";
            case SERVICE_UNAVAILABLE -> "Servicio no disponible";
            default -> "Error del servidor";
        };
    }
}
