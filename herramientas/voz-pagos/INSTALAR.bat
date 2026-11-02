@echo off
title Instalar voz de pagos - ROAL BURGER
echo.
echo  Instalando la voz de pagos de Bancolombia...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1"
echo.
pause
