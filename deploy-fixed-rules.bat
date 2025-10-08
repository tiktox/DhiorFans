@echo off
echo Desplegando reglas de Firestore corregidas...
firebase deploy --only firestore:rules
echo Reglas desplegadas exitosamente!
pause