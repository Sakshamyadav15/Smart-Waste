#!/bin/bash

# Quick Start Script for EcoSort SmartWaste Backend
# For Unix/Linux/macOS

set -e

echo "🌱 EcoSort SmartWaste Backend - Quick Start"
echo "========================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    echo "Download from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env file
echo "Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your configuration:"
    echo "   - HF_API_TOKEN: Get from https://huggingface.co/settings/tokens"
    echo "   - ADMIN_API_KEY: Set a secure random string"
    echo ""
    read -p "Press Enter when ready to continue, or Ctrl+C to exit..."
else
    echo "✅ .env file exists"
fi
echo ""

# Check for required environment variables
echo "Validating environment variables..."
if grep -q "HF_API_TOKEN=hf_" .env; then
    echo "✅ HF_API_TOKEN is configured"
else
    echo "❌ HF_API_TOKEN is not configured in .env"
    echo "   Get your token from: https://huggingface.co/settings/tokens"
    exit 1
fi
echo ""

# Run database migrations
echo "Setting up database..."
npm run migrate
echo "✅ Database migrated"
echo ""

# Seed database
echo "Seeding database with default data..."
if npm run seed; then
    echo "✅ Database seeded"
else
    echo "⚠️  Database seeding failed (this might be OK if already seeded)"
fi
echo ""

# All done!
echo "========================================="
echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  npm run dev     # Development mode with auto-reload"
echo "  npm start       # Production mode"
echo ""
echo "Server will run at: http://localhost:5000"
echo ""
echo "Test the API:"
echo "  curl http://localhost:5000/health"
echo ""
echo "Next steps:"
echo "  1. Start the server: npm run dev"
echo "  2. Test classification endpoint with an image"
echo "  3. Check logs in ./logs/ directory"
echo "  4. Review README.md for full documentation"
echo ""
echo "Happy coding! 🚀"
