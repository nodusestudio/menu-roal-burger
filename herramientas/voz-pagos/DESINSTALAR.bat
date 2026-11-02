@echo off
title Quitar voz de pagos - ROAL BURGER
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*RoalVoz*voz-pagos.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Unregister-ScheduledTask -TaskName 'RoalVozPagos' -Confirm:$false -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force (Join-Path $env:LOCALAPPDATA 'RoalVoz') -ErrorAction SilentlyContinue; Write-Host 'Voz de pagos quitada de este computador.'"
echo.
pause
