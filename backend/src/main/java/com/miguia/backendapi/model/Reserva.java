package com.miguia.backendapi.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reservas")
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Long idReserva;
    @Column(name = "codigo", nullable = false, length = 30, unique = true)
    private String codigo;
    @Column(name = "id_negocio", nullable = false)
    private Long idNegocio;
    @Column(name = "id_cliente", nullable = false)
    private Long idCliente;
    @Column(name = "id_servicio", nullable = false)
    private Long idServicio;
    @Column(name = "fecha_reserva", nullable = false)
    private LocalDateTime fechaReserva;
    @Column(name = "cantidad_personas", nullable = false)
    private Integer cantidadPersonas;
    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;
    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public Long getIdReserva() { return idReserva; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String v) { codigo = v; }
    public Long getIdNegocio() { return idNegocio; }
    public void setIdNegocio(Long v) { idNegocio = v; }
    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long v) { idCliente = v; }
    public Long getIdServicio() { return idServicio; }
    public void setIdServicio(Long v) { idServicio = v; }
    public LocalDateTime getFechaReserva() { return fechaReserva; }
    public void setFechaReserva(LocalDateTime v) { fechaReserva = v; }
    public Integer getCantidadPersonas() { return cantidadPersonas; }
    public void setCantidadPersonas(Integer v) { cantidadPersonas = v; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal v) { precioUnitario = v; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal v) { total = v; }
    public String getEstado() { return estado; }
    public void setEstado(String v) { estado = v; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String v) { observaciones = v; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
}
