# Quick Start Script for EcoSort SmartWaste Backend

Write-Host "🌱 EcoSort SmartWaste Backend - Quick Start" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18 or later." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Check for .env file
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env and add your configuration:" -ForegroundColor Red
    Write-Host "   - HF_API_TOKEN: Get from https://huggingface.co/settings/tokens" -ForegroundColor Cyan
    Write-Host "   - ADMIN_API_KEY: Set a secure random string" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Press Enter when ready to continue, or Ctrl+C to exit"
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Check for required environment variables
Write-Host "Validating environment variables..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
if ($envContent -match "HF_API_TOKEN=hf_") {
    Write-Host "✅ HF_API_TOKEN is configured" -ForegroundColor Green
} else {
    Write-Host "❌ HF_API_TOKEN is not configured in .env" -ForegroundColor Red
    Write-Host "   Get your token from: https://huggingface.co/settings/tokens" -ForegroundColor Cyan
    exit 1
}
Write-Host ""

# Run database migrations
Write-Host "Setting up database..." -ForegroundColor Yellow
npm run migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database migrated" -ForegroundColor Green
Write-Host ""

# Seed database
Write-Host "Seeding database with default data..." -ForegroundColor Yellow
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database seeding failed (this might be OK if already seeded)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Database seeded" -ForegroundColor Green
}
Write-Host ""

# All done!
Write-Host "=========================================" -ForegroundColor Green
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server:" -ForegroundColor Cyan
Write-Host "  npm run dev     # Development mode with auto-reload" -ForegroundColor White
Write-Host "  npm start       # Production mode" -ForegroundColor White
Write-Host ""
Write-Host "Server will run at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test the API:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start the server: npm run dev" -ForegroundColor White
Write-Host "  2. Test classification endpoint with an image" -ForegroundColor White
Write-Host "  3. Check logs in ./logs/ directory" -ForegroundColor White
Write-Host "  4. Review README.md for full documentation" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
