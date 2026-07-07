@echo off
if "%1"=="TUNNEL" goto run_tunnel

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
    echo Starting public tunnel in a new window...
    start "Jigar Web Agent Public Tunnel" "%~nx0" TUNNEL
    
    echo Waiting a few seconds for URL generation...
    ping 127.0.0.1 -n 5 >nul
    
    echo ========================================================
    echo A new window has opened with your public URL!
    echo ========================================================
    echo.
    echo Screen will turn off in 120 seconds...
    start /min powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 120; (Add-Type '[DllImport(\"user32.dll\")]public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);' -Name a -Pass)::SendMessage(-1, 0x0112, 0xF170, 2)"
)

:start_uvicorn
call venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
echo.
echo [!] Uvicorn stopped or crashed! Restarting in 5 seconds to keep the backend alive...
ping 127.0.0.1 -n 6 >nul
goto start_uvicorn

pause
goto :eof

:run_tunnel
color 0a
echo ===========================================
echo PUBLIC TUNNEL - DO NOT CLOSE THIS WINDOW
echo ===========================================
echo.
cloudflared.exe tunnel --url http://127.0.0.1:8000
echo.
echo Tunnel crashed or disconnected, restarting...
ping 127.0.0.1 -n 3 >nul
goto run_tunnel
