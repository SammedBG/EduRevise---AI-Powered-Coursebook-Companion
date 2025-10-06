@echo off
echo 🚀 Starting Study Buddy Application...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    npm install
    cd ..
)

if not exist "client\node_modules" (
    echo 📦 Installing client dependencies...
    cd client
    npm install
    cd ..
)

REM Check if .env file exists
if not exist "server\.env" (
    echo ⚙️  Creating .env file from template...
    copy server\env.example server\.env
    echo 📝 Please edit server\.env with your configuration before running again.
    echo    Required: MongoDB URI, JWT Secret, OpenAI API Key (optional)
    pause
    exit /b 1
)

REM Seed database with sample data (optional)
set /p seed="🌱 Do you want to seed the database with sample NCERT Physics data? (y/n): "
if /i "%seed%"=="y" (
    echo 🌱 Seeding database...
    cd server
    npm run seed
    cd ..
    echo ✅ Database seeded successfully!
    echo    Demo credentials: student@demo.com / password
)

echo 🎉 Setup complete! Starting the application...
echo 📱 Frontend will be available at: http://localhost:3000
echo 🔧 Backend API will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the application
echo.

REM Start the application
npm run dev
