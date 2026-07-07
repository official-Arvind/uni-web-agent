@echo off
:: Ensure we are in the correct directory even if ran as admin
cd /d "%~dp0"

echo ========================================================
echo Starting Jigar Universal Web Agent Backend
echo ========================================================
echo.

echo [1] Start Local Server (Laptop only)
echo [2] Start Public Server (Access from anywhere, display turns off)
set /p MODE="Select mode [1/2]: "

:: Automatically find and kill any process using port 8000
echo Checking if port 8000 is in use...
:kill_loop
set "KILLED_SOMETHING=0"
FOR /F "tokens=5" %%T IN ('netstat -ano ^| findstr :8000') DO (
    if "%%T" NEQ "0" (
        if "%%T" NEQ "4" (
            taskkill /F /T /PID %%T >nul 2>&1
            set "KILLED_SOMETHING=1"
        )
    )
)
if "%KILLED_SOMETHING%"=="1" (
    ping 127.0.0.1 -n 3 >nul
    goto kill_loop
)

set PYTHONIOENCODING=utf-8

if "%MODE%"=="2" (
    echo Starting localtunnel in the background...
    echo. > tunnel_url.txt
    start /b cmd /c "npx --yes localtunnel --port 8000 > tunnel_url.txt"
    echo Waiting for URL generation...
    
:wait_url
    for %%I in (tunnel_url.txt) do if %%~zI LEQ 5 (
        ping 127.0.0.1 -n 2 >nul
        goto wait_url
    )
    
    echo.
    echo ========================================================
    type tunnel_url.txt
    echo ========================================================
    echo.
    echo Screen will turn off in 30 seconds...
    start /b powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 30; (Add-Type '[DllImport(\"user32.dll\")]public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);' -Name a -Pass)::SendMessage(-1, 0x0112, 0xF170, 2)"
)

call venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

pause
