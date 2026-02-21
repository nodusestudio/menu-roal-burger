@echo off
REM Script para añadir, commitear y pushear cambios al repo remoto desde la carpeta del proyecto.
REM Úsalo desde PowerShell o cmd en la carpeta del proyecto.

echo Verificando estado del repositorio...
git status

echo Añadiendo todos los cambios...
git add -A

echo Haciendo commit...
git commit -m "Fix: Eliminación de video intro y ajuste de títulos en landing page"
if errorlevel 1 (
    echo No se hizo commit (posible: no hay cambios o hay conflictos). Revisa 'git status'.
    pause
    exit /b 1
)

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
echo Pushing to origin/%BRANCH% ...
git push origin %BRANCH%
if errorlevel 1 (
+    echo Error al pushear. Asegurate de tener el remote "origin" configurado y credenciales correctas.
+    echo Si no tienes remote, ejecuta: git remote add origin <URL>
+    pause
+    exit /b 1
+)

echo Push completado correctamente.
echo.
echo Actualizando despliegue en Vercel...
echo(
echo Si tienes las herramientas de Vercel instaladas, ejecuta uno de estos comandos:
echo - Opción 1: vercel --prod (requiere Vercel CLI instalado)
echo - Opción 2: El despliegue se activará automáticamente en Vercel al detectar cambios en GitHub
echo.
pause
