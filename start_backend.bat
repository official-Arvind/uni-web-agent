@echo off
:: Ensure we are in the correct directory even if ran as admin
cd /d "%~dp0"

echo ========================================================
echo Starting Jigar Universal Web Agent Backend
echo ========================================================
echo.
echo NOTE: Playwright on Windows requires ProactorEventLoop.
echo Using uvicorn with --reload causes asyncio to break on Windows.
echo This script starts the server safely.
echo.

:: Automatically find and kill any process using port 8000 (and its children)
echo Checking if port 8000 is in use...
:kill_loop
set "KILLED_SOMETHING=0"
FOR /F "tokens=5" %%T IN ('netstat -ano ^| findstr :8000') DO (
    if "%%T" NEQ "0" (
        if "%%T" NEQ "4" (
            echo Killing process PID %%T...
            taskkill /F /T /PID %%T >nul 2>&1
            set "KILLED_SOMETHING=1"
        )
    )
)

if "%KILLED_SOMETHING%"=="1" (
    echo Waiting a moment for the port to be freed...
    timeout /T 2 /NOBREAK >nul
    goto kill_loop
)
echo Port 8000 is successfully cleared!
echo.

set PYTHONIOENCODING=utf-8
call venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

echo.
echo Server has stopped.
pause
