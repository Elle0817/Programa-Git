
package com.miguia.backendapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EstadoController {

    @GetMapping("/api/estado")
    public String consultarEstado() {
        return "Mi Guia Turistico API funcionando correctamente";
    }
}
