package com.miguia.backendapi.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "servicios")
public class Servicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servicio")
    private Long idServicio;

    @NotNull(message = "El negocio es obligatorio")
    @Positive(message = "El identificador del negocio debe ser positivo")
    @Column(name = "id_negocio", nullable = false)
    private Long idNegocio;

    @Column(name = "id_categoria")
    private Integer idCategoria;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
    @Column(name = "precio", nullable = false, precision = 12, scale = 2)
    private BigDecimal precio = BigDecimal.ZERO;

    @Min(value = 1, message = "La duración debe ser de al menos un minuto")
    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    @NotNull(message = "Los cupos son obligatorios")
    @Min(value = 0, message = "Los cupos no pueden ser negativos")
    @Column(name = "cupos", nullable = false)
    private Integer cupos = 1;

    @NotBlank(message = "El estado es obligatorio")
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "Borrador";

    public Servicio() {
    }

    public Long getIdServicio() {
        return idServicio;
    }

    public Long getIdNegocio() {
        return idNegocio;
    }

    public void setIdNegocio(Long idNegocio) {
        this.idNegocio = idNegocio;
    }

    public Integer getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(Integer idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public Integer getCupos() {
        return cupos;
    }

    public void setCupos(Integer cupos) {
        this.cupos = cupos;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
