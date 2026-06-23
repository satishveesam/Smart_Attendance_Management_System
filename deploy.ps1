# Smart ATS Auto-Deployment Script
$ErrorActionPreference = "Stop"

# Configuration
$KEY_PATH = "C:\Users\satish\OneDrive\Desktop\attendance-key.pem"
$EC2_IP = "52.63.150.105"
$EC2_USER = "ec2-user"
$BASE_DIR = $PSScriptRoot

Write-Host "🚀 Starting Deployment Process..." -ForegroundColor Cyan

# 1. Fix key file permissions for Windows SSH client
Write-Host "🔒 Setting secure permissions on the private key file..." -ForegroundColor Gray
icacls $KEY_PATH /inheritance:r | Out-Null
icacls $KEY_PATH /grant:r "$($env:USERNAME):(R)" | Out-Null

# 2. Build Backend
Write-Host "📦 Building Backend (Spring Boot)..." -ForegroundColor Yellow
cd "$BASE_DIR\backend"
.\mvnw.cmd clean package -DskipTests

# 3. Build Frontend
Write-Host "📦 Building Frontend (Vite/React)..." -ForegroundColor Yellow
cd "$BASE_DIR\frontend"
npm run build

# 4. Upload Backend JAR
Write-Host "📤 Uploading backend JAR to EC2..." -ForegroundColor Yellow
scp -i $KEY_PATH "$BASE_DIR\backend\target\*.jar" "$($EC2_USER)@$($EC2_IP):/home/ec2-user/app.jar"

# 5. Upload Frontend Files
Write-Host "📤 Uploading frontend static assets to EC2..." -ForegroundColor Yellow
# Clean target folder first to prevent stale files, then upload
ssh -i $KEY_PATH "$($EC2_USER)@$($EC2_IP)" "sudo rm -rf /var/www/attendance/*"
scp -i $KEY_PATH -r "$BASE_DIR\frontend\dist\*" "$($EC2_USER)@$($EC2_IP):/var/www/attendance/"

# 6. Restart Backend Service
Write-Host "🔄 Restarting backend service on EC2..." -ForegroundColor Yellow
ssh -i $KEY_PATH "$($EC2_USER)@$($EC2_IP)" "sudo systemctl restart attendance"

Write-Host "✨ Deployment completed successfully! App is live at http://$EC2_IP/" -ForegroundColor Green
