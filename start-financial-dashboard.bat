@echo off
title Financial Dashboard
echo.
echo ========================================
echo   Financial Dashboard - Iniciando...
echo ========================================
echo.

REM Inicia a aplicação usando WSL
wsl -d Ubuntu -- bash -c "cd /home/claudio/projetos/financial-app-dashboard && ./start-app.sh"

pause
