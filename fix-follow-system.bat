@echo off
echo ========================================
echo SISTEMA DE TOKENS DEFINITIVO v3.0
echo ========================================
echo.
echo SISTEMA DE TOKENS:
echo - Base: 10 tokens cada 24 horas
echo - Bonus: +50 tokens diarios por cada 500 seguidores
echo - Hitos: 50 tokens inmediatos al alcanzar 500, 1000, 1500...
echo.
echo EJEMPLOS:
echo - 0-499 seguidores = 10 tokens diarios
echo - 500-999 seguidores = 60 tokens diarios
echo - 1000-1499 seguidores = 110 tokens diarios
echo.
echo 1. Desplegando sistema actualizado...
firebase deploy --only firestore:rules
echo.
echo 2. Sistema desplegado!
echo.
echo ========================================
echo SISTEMA DE TOKENS LISTO
echo ========================================
pause