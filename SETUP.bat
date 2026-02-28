@echo off
echo 🛠️ Setting up Intrusion Detection System...
echo.

echo 📦 Installing Python Dependencies...
cd /d "%~dp0Server"
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Python dependencies installation failed!
    pause
    exit /b 1
)

echo ✅ Python dependencies installed successfully!
echo.

echo 📦 Installing Node.js Dependencies...
cd /d "%~dp0client"
npm install
if errorlevel 1 (
    echo ❌ Node.js dependencies installation failed!
    pause
    exit /b 1
)

echo ✅ Node.js dependencies installed successfully!
echo.

echo 📁 Creating required directories...
if not exist "%~dp0Server\uploads" mkdir "%~dp0Server\uploads"
if not exist "%~dp0Server\models" mkdir "%~dp0Server\models"
echo ✅ Directories created!

echo.
echo 🎉 Setup Complete!
echo.
echo 📋 Next Steps:
echo 1. Download CICIDS2017 dataset: https://www.kaggle.com/datasets/cic/cicids2017
echo 2. Place CSV file in: Server\uploads\cicids2017.csv
echo 3. Run START.bat to launch the system
echo.
echo 🚀 Ready to start detecting intrusions!
echo.
pause
