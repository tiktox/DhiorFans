@echo off
echo Desplegando reglas de Firebase...
firebase deploy --only storage:rules
firebase deploy --only firestore:rules
echo Reglas desplegadas correctamente
pause