package com.miguia.backendapi.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miguia.backendapi.dto.ReservaRequest;
import com.miguia.backendapi.dto.ReservaResponse;
import com.miguia.backendapi.model.Cliente;
import com.miguia.backendapi.model.Reserva;
import com.miguia.backendapi.model.Servicio;
import com.miguia.backendapi.repository.ClienteRepository;
import com.miguia.backendapi.repository.ReservaRepository;
import com.miguia.backendapi.repository.ServicioRepository;

@Service
public class ReservaService {
    private final ReservaRepository reservas;
    private final ClienteRepository clientes;
    private final ServicioRepository servicios;
    private final NegocioActivoService negocioActivo;

    public ReservaService(ReservaRepository reservas, ClienteRepository clientes,
            ServicioRepository servicios, NegocioActivoService negocioActivo) {
        this.reservas = reservas;
        this.clientes = clientes;
        this.servicios = servicios;
        this.negocioActivo = negocioActivo;
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listar(LocalDateTime desde, LocalDateTime hasta,
            String estado, Long cliente, Long servicio, String texto) {
        Long negocio = negocioActivo.requerirId();
        if (estado != null && !List.of("Pendiente", "Confirmada", "Completada", "Cancelada").contains(estado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de reserva no válido");
        }
        if (desde != null && hasta != null && !desde.isBefore(hasta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El periodo no es válido");
        }
        return reservas.buscar(negocio, desde, hasta, estado, cliente, servicio,
                texto == null || texto.isBlank() ? null : texto.trim()).stream()
                .map(this::respuesta).toList();
    }

    @Transactional(readOnly = true)
    public ReservaResponse obtener(Long id) { return respuesta(buscarActivo(id)); }

    @Transactional
    public ReservaResponse crear(ReservaRequest datos) {
        Long negocio = negocioActivo.requerirId();
        Cliente cliente = clienteDelNegocio(datos.idCliente(), negocio);
        Servicio servicio = servicioReservable(datos.idServicio(), negocio);
        validarCupos(datos.cantidadPersonas(), servicio);
        LocalDateTime inicio = normalizarFecha(datos.fechaReserva(), null);
        validarDisponibilidad(servicio, inicio, null, negocio);

        Reserva reserva = new Reserva();
        reserva.setCodigo(generarCodigo());
        reserva.setIdNegocio(negocio);
        reserva.setIdCliente(cliente.getIdCliente());
        reserva.setIdServicio(servicio.getIdServicio());
        reserva.setFechaReserva(inicio);
        reserva.setCantidadPersonas(datos.cantidadPersonas());
        reserva.setPrecioUnitario(servicio.getPrecio().setScale(2, RoundingMode.HALF_UP));
        reserva.setTotal(calcularTotal(reserva.getPrecioUnitario(), datos.cantidadPersonas()));
        reserva.setEstado("Pendiente");
        reserva.setObservaciones(limpiar(datos.observaciones()));
        return respuesta(reservas.saveAndFlush(reserva));
    }

    @Transactional
    public ReservaResponse editar(Long id, ReservaRequest datos) {
        Long negocio = negocioActivo.requerirId();
        Reserva reserva = buscarActivo(id);
        if ("Cancelada".equals(reserva.getEstado()) || "Completada".equals(reserva.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede editar una reserva cancelada o completada");
        }
        if (!reserva.getIdServicio().equals(datos.idServicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El servicio de una reserva existente no se puede cambiar");
        }
        Cliente cliente = clienteDelNegocio(datos.idCliente(), negocio);
        Servicio servicio = servicioReservable(reserva.getIdServicio(), negocio);
        validarCupos(datos.cantidadPersonas(), servicio);
        LocalDateTime inicio = normalizarFecha(datos.fechaReserva(), reserva.getFechaReserva());
        validarDisponibilidad(servicio, inicio, id, negocio);
        reserva.setIdCliente(cliente.getIdCliente());
        reserva.setFechaReserva(inicio);
        reserva.setCantidadPersonas(datos.cantidadPersonas());
        reserva.setTotal(calcularTotal(reserva.getPrecioUnitario(), datos.cantidadPersonas()));
        reserva.setObservaciones(limpiar(datos.observaciones()));
        return respuesta(reservas.saveAndFlush(reserva));
    }

    @Transactional
    public ReservaResponse cambiarEstado(Long id, String nuevoEstado) {
        Reserva reserva = buscarActivo(id);
        boolean permitido = switch (String.valueOf(reserva.getEstado())) {
            case "Pendiente" -> List.of("Confirmada", "Cancelada").contains(nuevoEstado);
            case "Confirmada" -> List.of("Completada", "Cancelada").contains(nuevoEstado);
            default -> false;
        };
        if (!permitido) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La transición de estado solicitada no es válida");
        }
        reserva.setEstado(nuevoEstado);
        return respuesta(reservas.saveAndFlush(reserva));
    }

    private Reserva buscarActivo(Long id) {
        Long negocio = negocioActivo.requerirId();
        Reserva r = reservas.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (!negocio.equals(r.getIdNegocio())) throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Reserva no encontrada");
        return r;
    }

    private Cliente clienteDelNegocio(Long id, Long negocio) {
        Cliente c = clientes.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        if (!negocio.equals(c.getIdNegocio())) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El cliente no pertenece al negocio activo");
        return c;
    }

    private Servicio servicioReservable(Long id, Long negocio) {
        Servicio s = servicios.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Servicio no encontrado"));
        if (!negocio.equals(s.getIdNegocio())) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El servicio no pertenece al negocio activo");
        if (!"Publicado".equals(s.getEstado())) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "El servicio no está publicado para reservas");
        return s;
    }

    private void validarCupos(Integer personas, Servicio servicio) {
        if (personas == null || personas < 1) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "La cantidad de personas debe ser positiva");
        if (servicio.getCupos() != null && personas > servicio.getCupos()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cantidad de personas supera los cupos del servicio");
        }
    }

    private void validarDisponibilidad(Servicio servicio, LocalDateTime inicio,
            Long excluir, Long negocio) {
        Integer duracion = servicio.getDuracionMinutos();
        if (duracion != null && duracion <= 0) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "El servicio tiene una duración no válida");
        LocalDateTime desde = duracion == null ? inicio : inicio.minusMinutes(duracion);
        LocalDateTime hasta = duracion == null ? inicio : inicio.plusMinutes(duracion);
        List<Reserva> candidatas = reservas.paraValidarDisponibilidad(
                negocio, servicio.getIdServicio(), desde, hasta);
        for (Reserva existente : candidatas) {
            if (excluir != null && excluir.equals(existente.getIdReserva())) continue;
            Integer duracionExistente = duracion;
            if (duracionExistente == null) {
                if (existente.getFechaReserva().equals(inicio)) conflicto();
            } else {
                LocalDateTime finExistente = existente.getFechaReserva().plusMinutes(duracionExistente);
                LocalDateTime finNuevo = inicio.plusMinutes(duracion);
                if (existente.getFechaReserva().isBefore(finNuevo) && finExistente.isAfter(inicio)) conflicto();
            }
        }
    }

    private void conflicto() {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "El servicio ya tiene una reserva activa en ese horario");
    }

    private LocalDateTime normalizarFecha(LocalDateTime fecha, LocalDateTime fechaAnterior) {
        if (fecha == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La fecha de reserva es obligatoria");
        LocalDateTime normalizada = fecha.withNano(0);
        if ((fechaAnterior == null || !normalizada.equals(fechaAnterior.withNano(0)))
                && normalizada.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de la reserva no puede estar en el pasado");
        }
        return normalizada;
    }

    private String generarCodigo() {
        for (int i = 0; i < 8; i++) {
            String codigo = "RES-" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 18).toUpperCase();
            if (!reservas.existsByCodigo(codigo)) return codigo;
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No fue posible generar un código único para la reserva");
    }

    private String limpiar(String texto) { return texto == null || texto.isBlank() ? null : texto.trim(); }

    private BigDecimal calcularTotal(BigDecimal unitario, Integer personas) {
        BigDecimal total = unitario.multiply(BigDecimal.valueOf(personas))
                .setScale(2, RoundingMode.HALF_UP);
        if (total.precision() > 12) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El total supera el máximo permitido por el esquema de reservas");
        return total;
    }

    private ReservaResponse respuesta(Reserva r) {
        Cliente c = clientes.findById(r.getIdCliente()).orElse(null);
        Servicio s = servicios.findById(r.getIdServicio()).orElse(null);
        return new ReservaResponse(r.getIdReserva(), r.getCodigo(), r.getIdNegocio(),
                r.getIdCliente(), c == null ? "—" : c.getNombre(), r.getIdServicio(),
                s == null ? "—" : s.getNombre(), r.getFechaReserva(), r.getCantidadPersonas(),
                r.getPrecioUnitario(), r.getTotal(), r.getEstado(), r.getObservaciones());
    }
}
