# Instala la voz de pagos: copia los archivos, la programa para arrancar sola al iniciar sesion en Windows y la prueba.
$ErrorActionPreference = 'Stop'
$dest = Join-Path $env:LOCALAPPDATA 'RoalVoz'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# Si ya estaba corriendo, se detiene para reemplazarla
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*RoalVoz*voz-pagos.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Copy-Item -Path (Join-Path $PSScriptRoot 'voz-pagos.ps1') -Destination $dest -Force
Copy-Item -Path (Join-Path $PSScriptRoot 'config.json') -Destination $dest -Force

# Lanzador sin ventana
$script = Join-Path $dest 'voz-pagos.ps1'
$vbs = Join-Path $dest 'iniciar-oculto.vbs'
$linea = 'CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""' + $script + '""", 0, False'
Set-Content -Path $vbs -Value $linea -Encoding ASCII

$accion = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $vbs + '"')
$disparador = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$conf = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'RoalVozPagos' -Action $accion -Trigger $disparador -Settings $conf -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName 'RoalVozPagos'

Start-Sleep -Seconds 3
Write-Host 'Probando la voz... deberias escuchar: "Prueba de voz. Pago recibido de Juan Perez por 27500 pesos."'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script -Prueba
Write-Host ''
Write-Host 'LISTO. La voz de pagos ya esta corriendo y arrancara sola cada vez que inicies sesion en este computador.'
