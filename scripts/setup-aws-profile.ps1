# Setup AWS Profile Script for Windows PowerShell
# This script helps set up a dedicated AWS profile for the Peptide Tracker project

param(
    [string]$ProfileName = "peptide-tracker"
)

Write-Host "🔧 Setting up AWS profile for Peptide Tracker..." -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Setting up AWS profile: $ProfileName" -ForegroundColor Cyan
Write-Host ""

# Check if profile already exists
$existingProfiles = aws configure list-profiles 2>$null
if ($existingProfiles -contains $ProfileName) {
    Write-Host "⚠️  Profile '$ProfileName' already exists." -ForegroundColor Yellow
    $response = Read-Host "🤔 Do you want to reconfigure it? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "✅ Using existing profile '$ProfileName'" -ForegroundColor Green
        exit 0
    }
}

Write-Host "🔑 Please provide your AWS credentials for the Peptide Tracker project:" -ForegroundColor Cyan
Write-Host ""

# Get AWS credentials
$AccessKeyId = Read-Host "AWS Access Key ID"
$SecretAccessKey = Read-Host "AWS Secret Access Key" -AsSecureString
$SecretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretAccessKey))

$DefaultRegion = Read-Host "Default region (us-east-1)"
if ([string]::IsNullOrEmpty($DefaultRegion)) {
    $DefaultRegion = "us-east-1"
}

# Configure the profile
Write-Host ""
Write-Host "📝 Configuring AWS profile '$ProfileName'..." -ForegroundColor Cyan

aws configure set aws_access_key_id $AccessKeyId --profile $ProfileName
aws configure set aws_secret_access_key $SecretAccessKeyPlain --profile $ProfileName
aws configure set default.region $DefaultRegion --profile $ProfileName
aws configure set default.output json --profile $ProfileName

Write-Host "✅ AWS profile '$ProfileName' configured successfully!" -ForegroundColor Green

# Test the profile
Write-Host ""
Write-Host "🔍 Testing the profile..." -ForegroundColor Cyan
try {
    $accountInfo = aws sts get-caller-identity --profile $ProfileName --output json | ConvertFrom-Json
    Write-Host "✅ Profile test successful!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 Profile Information:" -ForegroundColor Cyan
    Write-Host "   Profile Name: $ProfileName" -ForegroundColor White
    Write-Host "   Account ID: $($accountInfo.Account)" -ForegroundColor White
    Write-Host "   User/Role: $($accountInfo.Arn)" -ForegroundColor White
    Write-Host "   Region: $DefaultRegion" -ForegroundColor White
    
    # Create a profile configuration file
    $configContent = @"
# AWS Profile Configuration for Peptide Tracker
# Generated on $(Get-Date)

`$env:AWS_PROFILE = "peptide-tracker"
`$env:AWS_DEFAULT_REGION = "$DefaultRegion"
`$env:AWS_REGION = "$DefaultRegion"

# Profile-specific environment variables
`$env:PEPTIDE_TRACKER_PROFILE = "$ProfileName"
`$env:PEPTIDE_TRACKER_ACCOUNT_ID = "$($accountInfo.Account)"
"@

    $configContent | Out-File -FilePath "aws-profile-config.ps1" -Encoding UTF8
    
    Write-Host ""
    Write-Host "📝 Created aws-profile-config.ps1 file" -ForegroundColor Green
    Write-Host "   You can source this file to use the profile: . .\aws-profile-config.ps1" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Profile test failed. Please check your credentials." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 AWS profile setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Source the profile: . .\aws-profile-config.ps1" -ForegroundColor White
Write-Host "   2. Run: .\scripts\deploy-infrastructure.ps1" -ForegroundColor White
Write-Host "   3. Run: .\scripts\deploy-complete.ps1" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: You can also use the profile directly:" -ForegroundColor Yellow
Write-Host "   aws s3 ls --profile peptide-tracker" -ForegroundColor White
