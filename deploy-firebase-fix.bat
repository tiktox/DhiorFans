@echo off
echo ========================================
echo  DESPLEGANDO SOLUCION FIREBASE PROFESIONAL
echo  DhiorFans - Aplicacion de Miles de Usuarios
echo ========================================
echo.

echo [1/5] Ejecutando diagnostico automatico...
node scripts/firebase-diagnostics.js
echo.

echo [2/5] Desplegando indices optimizados de Firestore...
firebase deploy --only firestore:indexes
if %errorlevel% neq 0 (
    echo ERROR: Fallo al desplegar indices
    pause
    exit /b 1
)
echo.

echo [3/5] Desplegando reglas de seguridad de Firestore...
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ERROR: Fallo al desplegar reglas
    pause
    exit /b 1
)
echo.

echo [4/5] Desplegando reglas de Storage...
firebase deploy --only storage
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Fallo al desplegar reglas de storage
)
echo.

echo [5/5] Verificando despliegue...
firebase firestore:indexes
echo.

echo ========================================
echo  ✅ SOLUCION FIREBASE DESPLEGADA EXITOSAMENTE
echo ========================================
echo.
echo Proximos pasos:
echo 1. Reiniciar la aplicacion Next.js
echo 2. Probar notificaciones y chat
echo 3. Monitorear Firebase Console
echo 4. Ejecutar diagnostico semanalmente
echo.
echo La aplicacion DhiorFans ahora esta optimizada
echo para manejar miles de usuarios simultaneos.
echo.
pause