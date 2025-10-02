@echo off
echo Desplegando reglas de Firestore...
firebase deploy --only firestore:rules
echo Reglas desplegadas exitosamente!
pause