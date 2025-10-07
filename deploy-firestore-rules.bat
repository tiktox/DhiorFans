@echo off
echo ========================================
echo   DESPLEGANDO REGLAS DE FIRESTORE
echo ========================================
echo.

echo Verificando Firebase CLI...
firebase --version
if %errorlevel% neq 0 (
    echo ERROR: Firebase CLI no esta instalado
    echo Instala con: npm install -g firebase-tools
    pause
    exit /b 1
)

echo.
echo Verificando autenticacion...
firebase projects:list
if %errorlevel% neq 0 (
    echo ERROR: No estas autenticado en Firebase
    echo Ejecuta: firebase login
    pause
    exit /b 1
)

echo.
echo Desplegando reglas de Firestore...
firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo.
    echo ✅ REGLAS DESPLEGADAS EXITOSAMENTE
    echo.
    echo Desplegando indices de Firestore...
    firebase deploy --only firestore:indexes
    
    if %errorlevel% equ 0 (
        echo.
        echo ✅ INDICES DESPLEGADOS EXITOSAMENTE
        echo.
        echo ========================================
        echo   DESPLIEGUE COMPLETADO
        echo ========================================
    ) else (
        echo.
        echo ❌ ERROR AL DESPLEGAR INDICES
    )
) else (
    echo.
    echo ❌ ERROR AL DESPLEGAR REGLAS
)

echo.
pause