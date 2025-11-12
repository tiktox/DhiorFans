@echo off
echo Desplegando indice de emails...
firebase deploy --only firestore:indexes
echo Listo!
pause
