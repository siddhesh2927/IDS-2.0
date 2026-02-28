@echo off
echo 🚀 Starting Intrusion Detection System...
echo.

echo 📡 Starting Python Backend Server...
cd /d "%~dp0Server"
start "Backend Server" cmd /k "python app.py"

echo 🌐 Starting React Frontend...
cd /d "%~dp0client"
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ System Starting Up!
echo 📡 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:3000
echo.
echo ⏳ Please wait for servers to start...
echo 📱 Open http://localhost:3000 in your browser
echo.
pause
