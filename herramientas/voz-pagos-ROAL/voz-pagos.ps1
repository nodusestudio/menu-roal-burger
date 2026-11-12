# Voz de pagos de Bancolombia (ROAL BURGER / FODEXA).
# Corre en segundo plano desde que se enciende el computador. Cada pocos segundos pregunta al servidor si llego un pago
# nuevo y lo dice en voz alta, sin importar que programa o pagina este abierta. No necesita navegador ni clics.
# Solo ASCII a proposito (PowerShell 5.1 lee mal los acentos en archivos sin BOM).
param([switch]$Prueba)
$ErrorActionPreference = 'Continue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logPath = Join-Path $dir 'voz-pagos.log'
$estadoPath = Join-Path $dir 'estado.txt'
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

if ($Prueba) { Decir 'Prueba de voz. Pago recibido de Juan Perez por veintisiete mil quinientos pesos.'; exit }

$cfg = Get-Content -Path (Join-Path $dir 'config.json') -Raw | ConvertFrom-Json
$desde = 0
if (Test-Path $estadoPath) { try { $desde = [int64](Get-Content $estadoPath -Raw).Trim() } catch { $desde = 0 } }
Log ('iniciado (desde=' + $desde + ')')

while ($true) {
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
                if (([int64]$r.ahora - $t) -lt 1200000) { Log ('pago: ' + $p.frase); Decir $p.frase }
            }
        }
        Start-Sleep -Seconds 5
    } catch {
        Log ('error: ' + $_.Exception.Message)
        Start-Sleep -Seconds 15
    }
}
