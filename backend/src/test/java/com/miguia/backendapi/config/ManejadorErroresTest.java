package com.miguia.backendapi.config;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import com.miguia.backendapi.model.Servicio;

class ManejadorErroresTest {
    @Test
    void validacionFallidaIncluyeDetail() throws Exception {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Servicio(), "servicio");
        binding.addError(new FieldError("servicio", "nombre", "El nombre es obligatorio"));
        Method method = getClass().getDeclaredMethod("metodoDePrueba", Servicio.class);
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(
                new MethodParameter(method, 0), binding);

        var response = new ManejadorErrores().manejarValidacion(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().get("status"));
        assertTrue(response.getBody().get("detail").toString().contains("nombre"));
    }

    @SuppressWarnings("unused")
    private void metodoDePrueba(Servicio servicio) { }
}
