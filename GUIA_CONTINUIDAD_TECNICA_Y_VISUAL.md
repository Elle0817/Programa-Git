# Guía de continuidad técnica y visual — Mi Guía Turístico

Revisión: 19 de noviembre de 2026  
Raíz: C:\Users\luisg\Desktop\Proyectos\MiGuiaTuristico_v2

Esta auditoría describe archivos inspeccionados sin iniciar servicios ni consultar la base de datos. No se leyó .env. No se modificó código fuente; este documento es el entregable. “Verificado” indica evidencia en archivos; “No comprobado” requiere ejecución o conexión real.

## 1. Resumen tecnológico

Frontend HTML/CSS/JavaScript sin framework declarado, servido con Python. Backend Java 25, Spring Boot 4.0.8, Spring MVC, Spring Data JPA y Bean Validation. Persistencia MySQL Connector/J; esquema mi_guia_turistico_v2; Hibernate usa ddl-auto=validate. Pruebas Java en backend/src/test y Playwright en pruebas-playwright. Puertos: frontend 3000, API 8080, MySQL 3306. El README indica JDK 25, MySQL y Python 3; Node.js para Playwright.

## 2. Estructura

Raíz frontend: index.html (dashboard), servicios.html, reservas.html, clientes.html, costos.html, calendario.html, reportes.html, configuracion.html; styles.css; api-common.js; script.js y archivos *-api.js por módulo. servidor_frontend.py sirve la raíz, permite rutas sin .html y publica /__estado. Scripts de arranque/parada: iniciar-proyecto.ps1 y detener-proyecto.ps1; iniciar-frontend.bat es otra alternativa. README.md, .env.example y .gitignore configuran/documentan el proyecto. evidencias/ guarda capturas; pruebas-playwright/ tiene pruebas; .runtime/ contiene logs/PID locales. Hay respaldos fechados y servicios.html.bak: no son la fuente activa.

Backend en backend/src/main/java/com/miguia/backendapi: config (CorsConfig, ManejadorErrores), controller, dto, model (Servicio, Cliente, Reserva, Costo, Actividad), repository (también negocio y categorías), service (ActividadService, CostoService, NegocioActivoService, ReportesService, ReservaService) y BackendApiApplication.java. Maven wrapper en backend/mvnw.cmd. No hay paquete entity separado ni se hallaron servicios dedicados de clientes/servicios. No se encontró carpeta de migraciones SQL versionadas.

## 3. Arranque y configuración

Desde PowerShell, en la raíz:

```powershell
.\iniciar-proyecto.ps1
```

Arranca backend con backend/run-backend-local.ps1 y mvnw.cmd spring-boot:run; inicia servidor_frontend.py y espera hasta 120 segundos por 8080 y 3000. URL: http://localhost:3000. Detener:

```powershell
.\detener-proyecto.ps1
```

Requiere MySQL disponible en localhost:3306. Variables de .env: DB_USER, DB_PASSWORD, NEGOCIO_ACTIVO_ID; SHOW_SQL opcional, false por defecto. .env está excluido de Git; no publicar credenciales. JDBC: jdbc:mysql://localhost:3306/mi_guia_turistico_v2; puerto Spring 8080. ddl-auto=validate requiere tablas existentes compatibles, no crea esquema. Frontend usa API fija http://localhost:8080. CORS permite http://localhost:3000 y http://127.0.0.1:3000.

El iniciador no toma 3000/8080 si identifica procesos ajenos. iniciar-frontend.bat, en cambio, termina procesos del 3000; usar con cuidado. No se inició el sistema porque arranca procesos y requiere credenciales. No comprobado: servicios disponibles, credenciales, esquema y arranque exitoso.

## 4. Identidad visual (styles.css)

Tokens: --azul #243b64; --azul-oscuro #172844; --violeta #6554a4; --violeta-claro #f0edfa; --fondo #f4f6fb; --blanco #ffffff; --texto #263247; --texto-secundario #6b7280; --borde #e2e7f0; radio 16px; sombra 0 5px 18px rgba(28,43,73,.06). Fuente Segoe UI, Arial, sans-serif; texto 14px/1.5. Título principal clamp(24px,2.5vw,32px), sidebar 21px, panel 17px.

Sidebar azul oscuro de 250px fija en escritorio; pasa arriba en móvil. Main alineado después de sidebar, padding 32px. Indicadores usan tarjetas blancas en cuadrícula con banda superior de color. Paneles blancos con borde/radio/sombra. Botones azules con texto blanco, padding 10x15, radio 9px; hover azul oscuro. Campos altura mínima 42px, borde #d7deea, radio 9px y foco violeta. Tablas con encabezado gris, divisores y scroll horizontal. Modal de servicios hasta 560px. Calendario usa tabla ancha y eventos por estado. Mensajes de módulo incluyen #mensaje-clientes y #mensaje-pagina con estados error/success. No se identificó biblioteca de iconos común.

Breakpoints: 1250, 900, 600, 430px; algunos ajustes de módulo en 800px. En móvil sidebar/navegación/formularios se reorganizan. styles.css mezcla selectores estructurales generales con reglas específicas añadidas; se repiten algunas reglas para inputs, disabled y [hidden]. Reusar tokens/clases y revisar impacto global antes de tocar selectores estructurales.

## 5. Componentes y patrones

api-common.js centraliza MGT.request, query y contexto del negocio. request usa fetch, configura JSON cuando hay body y presenta errores de red/CORS/HTTP. Reutilizarlo; no crear otra URL base/cliente HTTP. Scripts de módulo usan IIFE y strict mode, async/await, JSON.stringify y métodos HTTP explícitos. IDs se codifican con encodeURIComponent en muchas rutas. Validación HTML/JS y mensajes varían; no se observó notificador común. Reservas usan PATCH para cambio de estado/cancelación.

## 6. API y módulos

Rutas verificadas en controladores:
- GET /api/estado; GET /api/contexto/negocio-activo
- Clientes: GET/POST /api/clientes; GET/PUT/DELETE /api/clientes/{id}
- Servicios: GET/POST /api/servicios; GET/PUT/DELETE /api/servicios/{id}; GET /api/categorias-servicios
- Reservas: GET/POST /api/reservas; GET/PUT /api/reservas/{id}; PATCH estado y cancelar
- Costos: CRUD /api/costos y /{id}; GET resumen y categorias
- Actividades: CRUD /api/actividades y /{id}
- GET /api/reportes/resumen

Dashboard combina contexto, servicios, clientes, reservas, categorías y reportes. Servicios y clientes tienen CRUD; reservas edición/estado/cancelación; calendario integra reservas y actividades; costos CRUD/resumen; reportes resumen por rango; configuración tiene HTML pero API propia no confirmada. Archivos frontend no garantizan conexión funcional. Hay pruebas Java y Playwright, pero no se ejecutaron.

Entidades visibles: servicios, clientes, reservas, costos y actividades; repositorios adicionales para negocios y categorías de servicio/costo. No se verificaron cardinalidades/esquema real. NegocioActivoService selecciona por NEGOCIO_ACTIVO_ID o automáticamente solo si hay exactamente un negocio activo. Algunas consultas incluyen idNegocio. Verificar aislamiento de empresa en cada consulta/mutación del backend; ID del cliente no autoriza acceso.

## 7. Precauciones, recomendaciones y checklist

MySQL debe estar activo; puerto ocupado puede impedir arranque; revisar logs bajo .runtime. ddl-auto=validate no migra la BD. Un contexto de negocio inválido puede producir 503. Cambio de origen requiere alinear CORS/API. API está fijada a localhost, no es configuración SaaS. No se verificó autenticación ni aislamiento multiempresa completo. La raíz no mostró .git, por lo que git status no fue posible.

Para nuevos módulos: usar MGT.request/contexto; acordar DTO y rutas reales; aplicar validación y aislamiento en servidor; reusar estructura/sidebar/paneles/tablas/tokens/breakpoints; aislar CSS por módulo; no editar respaldos; preparar migración explícita cuando cambie esquema.

Lista antes de integrar:
- [ ] Estoy en la raíz activa, no en un respaldo.
- [ ] Revisé módulos relacionados y evité duplicar utilidades.
- [ ] Reutilicé API/contexto común y verifiqué contrato del backend.
- [ ] Servidor valida empresa y propiedad de registros.
- [ ] Revisé errores, formularios, estados vacíos y vista móvil.
- [ ] Reutilicé identidad visual.
- [ ] Cambios de BD tienen migración compatible.
- [ ] No incluí secretos y actualicé esta guía para cambios compartidos.

Comando rápido: desde C:\Users\luisg\Desktop\Proyectos\MiGuiaTuristico_v2 ejecutar .\iniciar-proyecto.ps1; abrir http://localhost:3000.
