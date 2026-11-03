# Voz de pagos de Bancolombia (ROAL BURGER / FODEXA).
# Corre en segundo plano desde que se enciende el computador. Cada pocos segundos pregunta al servidor si llego un pago
# nuevo, lo dice en voz alta y muestra una ventanita abajo ("Pago recibido de ... por ...") durante unos segundos, sin
# importar que programa o pagina este abierta. No necesita navegador ni clics.
# Se identifica con el nombre de este computador; desde FODEXA (Pagos Bancolombia) se le puede silenciar (voz y ventanita).
# Solo ASCII a proposito (PowerShell 5.1 lee mal los acentos en archivos sin BOM).
param([switch]$Prueba)
$ErrorActionPreference = 'Continue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logPath = Join-Path $dir 'voz-pagos.log'
$estadoPath = Join-Path $dir 'estado.txt'
$segundosVentana = 10
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
if ($env:ROALVOZ_MUDO -eq '1') { $voz.Volume = 0 }   # solo para pruebas sin sonido
$voz.Rate = 0

# --- Ventanita de aviso (abajo al centro, siempre visible, sin quitarle el foco a lo que se este haciendo) ---
$toast = $null
$script:cierraToast = [DateTime]::MinValue
try {
    Add-Type -AssemblyName System.Windows.Forms, System.Drawing
    Add-Type -ReferencedAssemblies System.Windows.Forms, System.Drawing -TypeDefinition @"
using System;
using System.Windows.Forms;
public class RoalToast : Form {
    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams {
        get { CreateParams cp = base.CreateParams; cp.ExStyle |= 0x08000000 | 0x00000080 | 0x00000008; return cp; }
    }
}
"@
    $toast = New-Object RoalToast
    $toast.FormBorderStyle = 'None'
    $toast.StartPosition = 'Manual'
    $toast.ShowInTaskbar = $false
    $toast.TopMost = $true
    $toast.BackColor = [System.Drawing.Color]::FromArgb(24, 28, 52)
    $toast.Size = New-Object System.Drawing.Size(580, 124)
    $verde = [System.Drawing.Color]::FromArgb(110, 226, 168)
    $barra = New-Object System.Windows.Forms.Panel
    $barra.BackColor = $verde; $barra.Dock = 'Left'; $barra.Width = 9
    $titulo = New-Object System.Windows.Forms.Label
    $titulo.Text = 'PAGO RECIBIDO'; $titulo.ForeColor = $verde; $titulo.AutoSize = $true
    $titulo.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
    $titulo.Location = New-Object System.Drawing.Point(26, 12)
    $lblNombre = New-Object System.Windows.Forms.Label
    $lblNombre.ForeColor = [System.Drawing.Color]::White; $lblNombre.AutoSize = $false; $lblNombre.AutoEllipsis = $true
    $lblNombre.Font = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Bold)
    $lblNombre.Location = New-Object System.Drawing.Point(26, 34); $lblNombre.Size = New-Object System.Drawing.Size(534, 34)
    $lblMonto = New-Object System.Windows.Forms.Label
    $lblMonto.ForeColor = $verde; $lblMonto.AutoSize = $false
    $lblMonto.Font = New-Object System.Drawing.Font('Segoe UI', 22, [System.Drawing.FontStyle]::Bold)
    $lblMonto.Location = New-Object System.Drawing.Point(26, 70); $lblMonto.Size = New-Object System.Drawing.Size(534, 44)
    $toast.Controls.AddRange(@($barra, $titulo, $lblNombre, $lblMonto))
    # Un clic en la ventanita la cierra
    foreach ($c in @($toast, $titulo, $lblNombre, $lblMonto, $barra)) { $c.Add_Click({ $toast.Hide() }) }
} catch { Log ('no se pudo preparar la ventanita: ' + $_.Exception.Message); $toast = $null }

function MostrarToast($nombre, $monto) {
    if ($toast -eq $null) { return }
    try {
        $lblNombre.Text = 'de ' + $nombre
        $lblMonto.Text = 'por $' + ([int64]$monto).ToString('N0', [System.Globalization.CultureInfo]::GetCultureInfo('es-CO'))
        $area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
        $toast.Location = New-Object System.Drawing.Point(($area.Left + [int](($area.Width - $toast.Width) / 2)), ($area.Bottom - $toast.Height - 28))
        $script:cierraToast = [DateTime]::UtcNow.AddSeconds($segundosVentana)
        if (-not $toast.Visible) { $toast.Show() }
        $toast.Refresh()
        Log ('ventanita: visible=' + $toast.Visible + ' en ' + $toast.Location.X + ',' + $toast.Location.Y + ' (pantalla ' + $area.Width + 'x' + $area.Height + ')')
    } catch { Log ('error en la ventanita: ' + $_.Exception.Message) }
}

# Atiende la ventanita (repintar, clics) y la oculta cuando se cumple el tiempo
function Bombear {
    if ($toast -eq $null) { return }
    try {
        [System.Windows.Forms.Application]::DoEvents()
        if ($toast.Visible -and [DateTime]::UtcNow -ge $script:cierraToast) { $toast.Hide() }
    } catch { }
}

# Habla sin bloquear: mientras suena la voz se sigue atendiendo la ventanita
function Decir($texto) {
    try {
        $voz.SpeakAsync($texto) | Out-Null
        $limite = [DateTime]::UtcNow.AddSeconds(40)
        Start-Sleep -Milliseconds 150
        while ($voz.State -ne 'Ready' -and [DateTime]::UtcNow -lt $limite) { Bombear; Start-Sleep -Milliseconds 50 }
    } catch { Log ('error de voz: ' + $_.Exception.Message) }
}

if ($Prueba) {
    MostrarToast 'Juan Perez' 27500
    Decir 'Prueba de voz. Muchas gracias Juan Perez por tu pago de 27500 pesos. Ya ha sido confirmado. Que vuelvas pronto.'
    while ($toast -ne $null -and $toast.Visible) { Bombear; Start-Sleep -Milliseconds 100 }
    exit
}

$cfg = Get-Content -Path (Join-Path $dir 'config.json') -Raw | ConvertFrom-Json
$desde = 0
if (Test-Path $estadoPath) { try { $desde = [int64](Get-Content $estadoPath -Raw).Trim() } catch { $desde = 0 } }
$silenciado = $false
Log ('iniciado (desde=' + $desde + ', equipo=' + $env:COMPUTERNAME + ')')

$proximo = [DateTime]::UtcNow
while ($true) {
    Bombear
    if ([DateTime]::UtcNow -ge $proximo) {
        $espera = 5
        try {
            $url = $cfg.url + '?equipo=' + [uri]::EscapeDataString($env:COMPUTERNAME)
            if ($desde -gt 0) { $url = $url + '&desde=' + $desde }
            $r = Invoke-RestMethod -Uri $url -Headers @{ 'x-banco-lector' = $cfg.token } -TimeoutSec 20
            $nuevoSilencio = [bool]$r.silenciado
            if ($nuevoSilencio -ne $silenciado) { $silenciado = $nuevoSilencio; Log ('silenciado=' + $silenciado) }
            if ($desde -le 0) {
                $desde = [int64]$r.ahora
                Set-Content -Path $estadoPath -Value $desde
            } else {
                foreach ($p in $r.pagos) {
                    $t = [int64]$p.creadoMs
                    if ($t -gt $desde) { $desde = $t; Set-Content -Path $estadoPath -Value $desde }
                    # Un pago de hace mas de 20 minutos ya no se anuncia (por ejemplo, si el computador estuvo apagado)
                    if (([int64]$r.ahora - $t) -lt 1200000) {
                        if ($silenciado) { Log ('pago (silenciado): ' + $p.frase) }
                        else {
                            Log ('pago: ' + $p.frase)
                            if ($p.nombre) { MostrarToast $p.nombre $p.monto }
                            Decir $p.frase
                        }
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
