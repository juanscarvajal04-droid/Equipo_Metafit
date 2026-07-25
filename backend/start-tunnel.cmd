@echo off
setlocal enabledelayedexpansion

set BACKEND_DIR=%~dp0
set PROJECT_DIR=%BACKEND_DIR%..
set MOVIL_URL_FILE=%PROJECT_DIR%\movil\src\services\tunnelUrl.js
set PORT=3001
set TUNNEL_PORT=%TUNNEL_PORT%
if "%TUNNEL_PORT%"=="" set TUNNEL_PORT=3001

echo ============================================
echo  MetaFit - Tunnel de desarrollo
echo ============================================

:: Verificar si el backend ya esta corriendo
netstat -ano | findstr ":%PORT% " >nul 2>&1
if %errorlevel% equ 0 (
    echo [v] Backend ya esta corriendo en el puerto %PORT%
) else (
    echo [...] Iniciando backend en el puerto %PORT%...
    cd /d "%BACKEND_DIR%"
    start /B node index.js
    :: Esperar al backend
    echo [...] Esperando a que el backend responda...
    for /l %%i in (1,1,30) do (
        curl -s http://localhost:%PORT%/health >nul 2>&1
        if !errorlevel! equ 0 (
            echo [v] Backend listo
            goto :start_tunnel
        )
        timeout /t 1 /nobreak >nul
    )
    echo [x] El backend no respondio despues de 30 segundos
    exit /b 1
)

:start_tunnel
echo [...] Iniciando localtunnel en el puerto %TUNNEL_PORT%...

:: Crear un archivo temporal para capturar la salida
set LT_OUTPUT=%TEMP%\metafit_tunnel.txt
call npx.cmd localtunnel --port %TUNNEL_PORT% > "%LT_OUTPUT%" 2>&1 &
set TUNNEL_PID=!errorlevel!

:: Esperar la URL del tunel
echo [...] Esperando URL del tunel...
set TUNNEL_URL=
for /l %%i in (1,1,30) do (
    findstr "your url is:" "%LT_OUTPUT%" >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%a in ('findstr "your url is:" "%LT_OUTPUT%"') do (
            set "TUNNEL_URL=%%a"
        )
        goto :got_url
    )
    timeout /t 1 /nobreak >nul
)

:got_url
if "%TUNNEL_URL%"=="" (
    echo [x] No se pudo obtener la URL del tunel
    type "%LT_OUTPUT%"
    exit /b 1
)

:: Extraer solo la URL
set TUNNEL_URL=!TUNNEL_URL:*your url is: =!
echo [v] Tunel creado: !TUNNEL_URL!

:: Escribir tunnelUrl.js
echo [...] Actualizando tunnelUrl.js...
(
    echo const TUNNEL_URL = '!TUNNEL_URL!';
    echo export default TUNNEL_URL;
) > "%MOVIL_URL_FILE%"

echo [v] tunnelUrl.js actualizado: !TUNNEL_URL!
echo.
echo ============================================
echo  Backend:    http://localhost:%PORT%
echo  Tunel:      !TUNNEL_URL!
echo  App movil:  Recargue Expo para usar el tunel
echo ============================================
echo.
echo Presione Ctrl+C para detener todo.

:: Mantener vivo
:wait_loop
timeout /t 1 /nobreak >nul
goto :wait_loop
