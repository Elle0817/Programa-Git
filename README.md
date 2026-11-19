# Mi Guía Turístico

## Requisitos

- JDK 25
- MySQL
- Python 3
- Node.js para las pruebas de Playwright

## Variables de entorno

Configure estas variables en el entorno local antes de iniciar el backend:

- `DB_USER`: usuario de MySQL.
- `DB_PASSWORD`: contraseña de MySQL.
- `NEGOCIO_ACTIVO_ID`: identificador del negocio activo.
- `SHOW_SQL`: muestra sentencias SQL cuando se establece en `true`; por defecto está desactivado.

No incluya credenciales en archivos versionados.

## Iniciar y detener

Desde PowerShell, en la raíz del proyecto:

```powershell
.\iniciar-proyecto.ps1
```

Para detener los procesos iniciados por el proyecto:

```powershell
.\detener-proyecto.ps1
```

## Pruebas

Pruebas del backend:

```powershell
cd backend
.\mvnw.cmd test
```

Pruebas de Playwright:

```powershell
cd pruebas-playwright
npm install
npx playwright test
```
