#!/bin/bash

# --- NOVA Voice Assistant EC2 Deploy Script ---
echo "🚀 Starting deployment..."

# 1. Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed: $(node -v)"
fi

# 2. Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed: $(pm2 -v)"
fi

# 3. Clean up existing PM2 processes for this app
echo "🧹 Clearing existing PM2 processes..."
pm2 delete nova-backend &> /dev/null || true

# 4. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# 5. Install frontend dependencies and build
echo "📦 Installing frontend dependencies and building..."
cd frontend
npm install
npm run build
cd ..

# 6. Run backend server using PM2
echo "🚀 Starting backend server with PM2..."
pm2 start ecosystem.config.js

# 7. Save PM2 state
pm2 save

echo "🎉 Deployment successful!"
echo "------------------------------------------------"
echo "You can check status using: pm2 status"
echo "You can view logs using: pm2 logs nova-backend"
echo "------------------------------------------------"
