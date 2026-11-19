package com.miguia.backendapi.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "costos")
public class Costo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_costo")
    private Long idCosto;
    @Column(name = "id_negocio", nullable = false)
    private Long idNegocio;
    @Column(name = "id_categoria_costo")
    private Integer idCategoriaCosto;
    @Column(name = "concepto", nullable = false, length = 180)
    private String concepto;
    @Column(name = "valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;
    @Column(name = "fecha_costo", nullable = false)
    private LocalDate fechaCosto;
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    public Long getIdCosto() { return idCosto; }
    public Long getIdNegocio() { return idNegocio; }
    public void setIdNegocio(Long v) { idNegocio = v; }
    public Integer getIdCategoriaCosto() { return idCategoriaCosto; }
    public void setIdCategoriaCosto(Integer v) { idCategoriaCosto = v; }
    public String getConcepto() { return concepto; }
    public void setConcepto(String v) { concepto = v; }
    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal v) { valor = v; }
    public LocalDate getFechaCosto() { return fechaCosto; }
    public void setFechaCosto(LocalDate v) { fechaCosto = v; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String v) { observaciones = v; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
}
