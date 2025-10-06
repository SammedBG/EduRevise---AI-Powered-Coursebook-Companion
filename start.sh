#!/bin/bash

# Study Buddy - Startup Script
echo "🚀 Starting Study Buddy Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running (optional check)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't seem to be running. Make sure MongoDB is started."
    echo "   You can start it with: mongod"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp server/env.example server/.env
    echo "📝 Please edit server/.env with your configuration before running again."
    echo "   Required: MongoDB URI, JWT Secret, OpenAI API Key (optional)"
    exit 1
fi

# Seed database with sample data (optional)
read -p "🌱 Do you want to seed the database with sample NCERT Physics data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    cd server && npm run seed && cd ..
    echo "✅ Database seeded successfully!"
    echo "   Demo credentials: student@demo.com / password"
fi

echo "🎉 Setup complete! Starting the application..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the application
npm run dev
