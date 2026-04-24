@echo off
chcp 65001 >nul
echo.
echo  Help AI Agency — Dashboard local
echo  Demarrage du serveur...
echo.

:: Lancer Python en arriere-plan
start /B python -m http.server 8080 2>nul
if %errorlevel% neq 0 (
    start /B python3 -m http.server 8080 2>nul
)

:: Attendre que le serveur soit pret
echo  Attente du serveur...
timeout /t 3 /nobreak >nul

:: Ouvrir le navigateur
echo  Ouverture du navigateur...
start "" "http://localhost:8080/dashboard.html"

echo.
echo  Serveur actif sur http://localhost:8080/dashboard.html
echo  Fermez cette fenetre pour arreter le serveur.
echo.
pause
