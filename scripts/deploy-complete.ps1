# Complete Deployment Script for Windows PowerShell
# This script deploys infrastructure and sets up GitHub secrets automatically

param(
    [string]$ProfileName = "peptide-tracker"
)

Write-Host "🚀 Starting complete Peptide Tracker deployment..." -ForegroundColor Green

# Set AWS profile
$env:AWS_PROFILE = $ProfileName

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check if terraform is installed
try {
    terraform --version | Out-Null
    Write-Host "✅ Terraform is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform is not installed. Please install Terraform first." -ForegroundColor Red
    Write-Host "   Visit: https://www.terraform.io/downloads.html" -ForegroundColor Yellow
    exit 1
}

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity --profile $ProfileName | Out-Null
    Write-Host "✅ AWS CLI is configured for profile '$ProfileName'" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured for profile '$ProfileName'." -ForegroundColor Red
    Write-Host "   Please run: .\scripts\setup-aws-profile.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if GitHub CLI is installed
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI (gh) is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI (gh) is not installed. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if GitHub CLI is authenticated
try {
    gh auth status | Out-Null
    Write-Host "✅ GitHub CLI is authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI is not authenticated. Please run 'gh auth login' first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites met!" -ForegroundColor Green

# Step 1: Deploy Infrastructure
Write-Host ""
Write-Host "🏗️  Step 1: Deploying AWS Infrastructure..." -ForegroundColor Cyan
& ".\scripts\deploy-infrastructure.ps1" -ProfileName $ProfileName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Infrastructure deployment failed." -ForegroundColor Red
    exit 1
}

# Step 2: Setup GitHub Secrets
Write-Host ""
Write-Host "🔐 Step 2: Setting up GitHub secrets..." -ForegroundColor Cyan
& ".\scripts\setup-github-secrets.ps1" -ProfileName $ProfileName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ GitHub secrets setup failed." -ForegroundColor Red
    exit 1
}

# Step 3: Test the deployment
Write-Host ""
Write-Host "🧪 Step 3: Testing the deployment..." -ForegroundColor Cyan

# Make a small test change
Write-Host "📝 Making a test change to trigger deployment..." -ForegroundColor Cyan
$testComment = "// Test deployment - $(Get-Date)"
Add-Content -Path "src\hello-world\index.ts" -Value $testComment

# Commit and push
Write-Host "📝 Committing and pushing changes..." -ForegroundColor Cyan
git add .
git commit -m "Test complete deployment pipeline - $(Get-Date)"
git push

Write-Host ""
Write-Host "🎉 Complete deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was deployed:" -ForegroundColor Cyan
Write-Host "   ✅ AWS Infrastructure (DynamoDB, Secrets Manager, IAM, API Gateway)" -ForegroundColor White
Write-Host "   ✅ GitHub Secrets (AWS credentials and resource names)" -ForegroundColor White
Write-Host "   ✅ Lambda Functions (via GitHub Actions)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Monitor your deployment:" -ForegroundColor Cyan
try {
    $repoUrl = git remote get-url origin
    $repoName = $repoUrl -replace '.*github.com[:/]([^.]*).*', '$1'
    Write-Host "   GitHub Actions: https://github.com/$repoName/actions" -ForegroundColor Yellow
} catch {
    Write-Host "   GitHub Actions: Check your repository's Actions tab" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "⏱️  The GitHub Actions workflow will now:" -ForegroundColor Cyan
Write-Host "   1. Build your TypeScript code" -ForegroundColor White
Write-Host "   2. Create deployment packages" -ForegroundColor White
Write-Host "   3. Deploy Lambda functions to AWS" -ForegroundColor White
Write-Host "   4. Configure API Gateway endpoints" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Your API will be available at the URL shown in the Terraform outputs!" -ForegroundColor Green
