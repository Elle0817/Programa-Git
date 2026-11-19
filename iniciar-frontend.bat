@echo off
setlocal
cd /d "%~dp0"
echo Buscando procesos viejos escuchando en el puerto 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
    echo   Cerrando proceso PID %%P
    taskkill /F /PID %%P >nul 2>&1
)
py "%~dp0servidor_frontend.py"
echo.
echo El servidor se detuvo. Revisa el mensaje de arriba.
pause
