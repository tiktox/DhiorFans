@echo off
echo 🚀 Desplegando actualizaciones de Firestore...

echo.
echo 📋 Desplegando reglas de seguridad...
firebase deploy --only firestore:rules

echo.
echo 📊 Desplegando índices...
firebase deploy --only firestore:indexes

echo.
echo ✅ Despliegue completado!
echo.
echo 🔍 Para verificar el estado:
echo   - Firebase Console: https://console.firebase.google.com/
echo   - Reglas: Firestore Database ^> Rules
echo   - Índices: Firestore Database ^> Indexes
echo.
pause