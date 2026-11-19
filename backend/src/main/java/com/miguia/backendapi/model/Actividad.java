package com.miguia.backendapi.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "actividades")
public class Actividad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_actividad", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long idActividad;

    @Column(name = "id_negocio", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long idNegocio;

    @Column(name = "titulo", nullable = false, length = 180)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "tipo", nullable = false, length = 12,
            columnDefinition = "ENUM('Evento','Actividad','Recordatorio')")
    private String tipo;

    @Column(name = "estado", nullable = false, length = 10,
            columnDefinition = "ENUM('Programada','Realizada','Cancelada')")
    private String estado;

    @PrePersist
    void aplicarValoresPredeterminados() {
        if (tipo == null) tipo = "Actividad";
        if (estado == null) estado = "Programada";
    }

    public Long getIdActividad() { return idActividad; }
    public Long getIdNegocio() { return idNegocio; }
    public void setIdNegocio(Long idNegocio) { this.idNegocio = idNegocio; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
