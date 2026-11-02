# Voz de pagos de Bancolombia (ROAL BURGER / FODEXA).
# Corre en segundo plano desde que se enciende el computador. Cada pocos segundos pregunta al servidor si llego un pago
# nuevo y lo dice en voz alta, sin importar que programa o pagina este abierta. No necesita navegador ni clics.
# Ademas escucha SOLO en este computador (127.0.0.1:47831) para que el boton de silenciar de FODEXA pueda apagarle la voz.
# Solo ASCII a proposito (PowerShell 5.1 lee mal los acentos en archivos sin BOM).
param([switch]$Prueba)
$ErrorActionPreference = 'Continue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logPath = Join-Path $dir 'voz-pagos.log'
$estadoPath = Join-Path $dir 'estado.txt'
$silencioPath = Join-Path $dir 'silencio.txt'   # si existe, la voz esta silenciada en este computador
function Log($m) {
    try {
        Add-Content -Path $logPath -Value ('{0} {1}' -f (Get-Date -Format 's'), $m)
        if ((Get-Item $logPath).Length -gt 400KB) { Set-Content -Path $logPath -Value '' }
    } catch { }
}

if (-not $Prueba) {
    # Una sola copia a la vez
    $script:mutex = New-Object System.Threading.Mutex($false, 'Global\RoalVozPagos')
    if (-not $script:mutex.WaitOne(0)) { exit }
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Speech
$voz = New-Object System.Speech.Synthesis.SpeechSynthesizer
$es = $voz.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like 'es*' } | Select-Object -First 1
if ($es) { $voz.SelectVoice($es.VoiceInfo.Name) } else { Log 'AVISO: no hay voz en espanol instalada; se usara la voz por defecto' }
$voz.Volume = 100
$voz.Rate = 0
function Decir($texto) { try { $voz.Speak($texto) } catch { Log ('error de voz: ' + $_.Exception.Message) } }

if ($Prueba) { Decir 'Prueba de voz. Muchas gracias Juan Perez por tu pago de 27500 pesos. Ya ha sido confirmado. Que vuelvas pronto.'; exit }

$cfg = Get-Content -Path (Join-Path $dir 'config.json') -Raw | ConvertFrom-Json
$desde = 0
if (Test-Path $estadoPath) { try { $desde = [int64](Get-Content $estadoPath -Raw).Trim() } catch { $desde = 0 } }
$silenciado = Test-Path $silencioPath
Log ('iniciado (desde=' + $desde + ', silenciado=' + $silenciado + ')')

# --- Canal local para el boton de silenciar de FODEXA (solo 127.0.0.1) ---
$srv = $null
try {
    $srv = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 47831)
    $srv.Start()
} catch { Log ('no se pudo abrir el canal local: ' + $_.Exception.Message); $srv = $null }

function Atender {
    while ($srv -ne $null -and $srv.Pending()) {
        $c = $srv.AcceptTcpClient()
        try {
            $c.ReceiveTimeout = 2000
            $st = $c.GetStream()
            $buf = New-Object byte[] 4096
            $n = $st.Read($buf, 0, 4096)
            $req = [Text.Encoding]::ASCII.GetString($buf, 0, $n)
            $linea = ($req -split "`r`n")[0]
            $origen = ''
            if ($req -match '(?im)^origin:\s*(\S+)') { $origen = $Matches[1] }
            $permitido = $origen -match '^https://(www\.)?roalburger\.com$' -or $origen -eq 'https://admin-roal.vercel.app'
            $codigo = '200 OK'; $cuerpo = ''
            if ($linea -like 'OPTIONS*') {
                $codigo = '204 No Content'
            } elseif ($linea -match '^GET /silenciar\?on=([01])') {
                if (-not $permitido) { $codigo = '403 Forbidden'; $cuerpo = '{"ok":false}' }
                else {
                    if ($Matches[1] -eq '1') { Set-Content -Path $silencioPath -Value '1'; $script:silenciado = $true }
                    else { Remove-Item $silencioPath -ErrorAction SilentlyContinue; $script:silenciado = $false }
                    Log ('silenciado=' + $script:silenciado)
                    $cuerpo = '{"ok":true,"silenciado":' + $script:silenciado.ToString().ToLower() + ',"equipo":"' + $env:COMPUTERNAME + '"}'
                }
            } elseif ($linea -like 'GET /estado*') {
                $cuerpo = '{"ok":true,"silenciado":' + $script:silenciado.ToString().ToLower() + ',"equipo":"' + $env:COMPUTERNAME + '"}'
            } else { $codigo = '404 Not Found' }
            $cab = "HTTP/1.1 $codigo`r`nContent-Type: application/json`r`nContent-Length: " + [Text.Encoding]::UTF8.GetByteCount($cuerpo) + "`r`nConnection: close`r`n"
            if ($permitido) { $cab += "Access-Control-Allow-Origin: $origen`r`nAccess-Control-Allow-Private-Network: true`r`nAccess-Control-Allow-Headers: *`r`nAccess-Control-Max-Age: 600`r`nVary: Origin`r`n" }
            $bytes = [Text.Encoding]::UTF8.GetBytes($cab + "`r`n" + $cuerpo)
            $st.Write($bytes, 0, $bytes.Length)
        } catch { Log ('canal local: ' + $_.Exception.Message) }
        finally { try { $c.Close() } catch { } }
    }
}

$proximo = [DateTime]::UtcNow
while ($true) {
    Atender
    if ([DateTime]::UtcNow -ge $proximo) {
        $espera = 5
        try {
            $url = $cfg.url
            if ($desde -gt 0) { $url = $url + '?desde=' + $desde }
            $r = Invoke-RestMethod -Uri $url -Headers @{ 'x-banco-lector' = $cfg.token } -TimeoutSec 20
            if ($desde -le 0) {
                $desde = [int64]$r.ahora
                Set-Content -Path $estadoPath -Value $desde
            } else {
                foreach ($p in $r.pagos) {
                    $t = [int64]$p.creadoMs
                    if ($t -gt $desde) { $desde = $t; Set-Content -Path $estadoPath -Value $desde }
                    # Un pago de hace mas de 20 minutos ya no se canta (por ejemplo, si el computador estuvo apagado)
                    if (([int64]$r.ahora - $t) -lt 1200000) {
                        if ($silenciado) { Log ('pago (silenciado): ' + $p.frase) }
                        else { Log ('pago: ' + $p.frase); Decir $p.frase }
                    }
                }
            }
        } catch {
            Log ('error: ' + $_.Exception.Message)
            $espera = 15
        }
        $proximo = [DateTime]::UtcNow.AddSeconds($espera)
    }
    Start-Sleep -Milliseconds 250
}
