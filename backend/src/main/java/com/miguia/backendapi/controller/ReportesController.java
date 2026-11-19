package com.miguia.backendapi.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.miguia.backendapi.service.ReportesService;

@RestController
@RequestMapping("/api/reportes")
public class ReportesController {
    private final ReportesService reportes;

    public ReportesController(ReportesService reportes) { this.reportes = reportes; }

    @GetMapping("/resumen")
    public Map<String, Object> resumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reportes.resumen(desde, hasta);
    }
}
