
package com.miguia.backendapi.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Long idCliente;

    @Column(name = "id_negocio", nullable = false)
    private Long idNegocio;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Email(message = "El correo no tiene un formato válido")
    @Size(max = 190)
    @Column(name = "correo", length = 190)
    private String correo;

    @Size(max = 30)
    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    public Cliente() {
    }

    @PrePersist
    public void prepararRegistro() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }

    public Long getIdCliente() {
        return idCliente;
    }

    public Long getIdNegocio() {
        return idNegocio;
    }

    public void setIdNegocio(Long idNegocio) {
        this.idNegocio = idNegocio;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
