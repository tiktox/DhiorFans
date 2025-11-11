@echo off
echo 🚀 Desplegando índices de Firestore de emergencia...
echo.

echo 📋 Verificando configuración de Firebase...
firebase use --add

echo.
echo 🔧 Desplegando índices de Firestore...
firebase deploy --only firestore:indexes

echo.
echo ✅ Despliegue de índices completado
echo 📋 Los índices pueden tardar unos minutos en construirse
echo 🔄 Mientras tanto, la aplicación usará métodos alternativos

pause