@echo off
:loop
node ./main.js
if %errorlevel% neq 0 (
    echo Le script a planté. Redémarrage dans 5 secondes...
    timeout /t 5
    goto loop
)
