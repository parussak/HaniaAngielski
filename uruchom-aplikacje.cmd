@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Zainstaluj Node.js 24, a nastepnie uruchom ten plik ponownie.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Pozostaw to okno otwarte podczas korzystania z aplikacji.
echo Aby zakonczyc, nacisnij Ctrl+C.
call npm.cmd run dev -- --open
pause
