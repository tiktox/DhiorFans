@echo off
echo Desplegando indices de Firestore...
firebase deploy --only firestore:indexes
echo.
echo Indices desplegados exitosamente!
pause
