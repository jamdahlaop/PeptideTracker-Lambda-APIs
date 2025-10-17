# Deploy Infrastructure Script for Windows PowerShell
# This script deploys the AWS infrastructure using Terraform

param(
    [string]$ProfileName = "peptide-tracker"
)

Write-Host "🚀 Deploying Peptide Tracker Infrastructure..." -ForegroundColor Green

# Set AWS profile
$env:AWS_PROFILE = $ProfileName
Write-Host "🔧 Using AWS profile: $ProfileName" -ForegroundColor Cyan

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

# Navigate to infrastructure directory
Set-Location infrastructure

# Check if terraform.tfvars exists
if (-not (Test-Path "terraform.tfvars")) {
    if (Test-Path "terraform.tfvars.example") {
        Write-Host "📝 Creating terraform.tfvars from example..." -ForegroundColor Cyan
        Copy-Item "terraform.tfvars.example" "terraform.tfvars"
        Write-Host "✅ Created terraform.tfvars (using default values)" -ForegroundColor Green
    } else {
        Write-Host "📝 Creating terraform.tfvars with default values..." -ForegroundColor Cyan
        $terraformVars = @"
# Terraform variables for Peptide Tracker
aws_region     = "us-east-1"
environment    = "dev"
project_name   = "peptide-tracker"
aws_profile    = "peptide-tracker"
lambda_timeout = 30
lambda_memory_size = 256
"@
        $terraformVars | Out-File -FilePath "terraform.tfvars" -Encoding UTF8
        Write-Host "✅ Created terraform.tfvars with default values" -ForegroundColor Green
    }
    Write-Host "📝 You can edit terraform.tfvars to customize your setup" -ForegroundColor Yellow
}

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Cyan
terraform init

# Plan the deployment
Write-Host "📋 Planning infrastructure deployment..." -ForegroundColor Cyan
terraform plan

# Ask for confirmation
Write-Host ""
$response = Read-Host "🤔 Do you want to deploy the infrastructure? (y/N)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Infrastructure deployment cancelled." -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Apply the infrastructure
Write-Host "🏗️  Deploying infrastructure..." -ForegroundColor Cyan
terraform apply -auto-approve

Write-Host "✅ Infrastructure deployed successfully!" -ForegroundColor Green

# Show outputs
Write-Host ""
Write-Host "📋 Infrastructure Summary:" -ForegroundColor Cyan
terraform output infrastructure_summary

Write-Host ""
Write-Host "🔐 GitHub Secrets to Add:" -ForegroundColor Cyan
terraform output github_secrets

Write-Host ""
Write-Host "🎉 Next steps:" -ForegroundColor Green
Write-Host "1. Add the GitHub secrets to your repository" -ForegroundColor White
Write-Host "2. Run: .\scripts\setup-github-secrets.ps1" -ForegroundColor White
Write-Host "3. Push your Lambda code to trigger deployment" -ForegroundColor White
Write-Host "4. Test your API endpoints" -ForegroundColor White

# Go back to project root
Set-Location ..
