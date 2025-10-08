@echo off
echo ========================================
echo SISTEMA DE TOKENS Y SEGUIMIENTO v2.0
echo ========================================
echo.
echo CARACTERISTICAS:
echo - 50 tokens por primer seguidor
echo - Tokens visibles en tiempo real
echo - Permisos corregidos
echo.
echo 1. Desplegando reglas corregidas...
firebase deploy --only firestore:rules
echo.
echo 2. Reglas desplegadas!
echo.
echo INSTRUCCIONES:
echo - Reinicia la aplicacion
echo - Prueba seguir a un usuario con 0 seguidores
echo - Verifica que reciba 50 tokens inmediatamente
echo.
echo ========================================
echo SISTEMA LISTO PARA USAR
echo ========================================
pause