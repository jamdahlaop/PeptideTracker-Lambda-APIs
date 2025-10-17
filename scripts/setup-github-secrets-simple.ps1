# Simple GitHub Secrets Setup Script
param(
    [string]$ProfileName = "peptide-tracker"
)

Write-Host "Setting up GitHub secrets..." -ForegroundColor Green

# Set AWS profile
$env:AWS_PROFILE = $ProfileName

# Check if gh CLI is installed
try {
    gh --version | Out-Null
    Write-Host "GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if user is authenticated
try {
    gh auth status | Out-Null
    Write-Host "GitHub CLI is authenticated" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI is not authenticated. Please run 'gh auth login' first." -ForegroundColor Red
    exit 1
}

# Navigate to infrastructure directory
Set-Location infrastructure

# Get the repository name
$repoUrl = git remote get-url origin
$repoName = $repoUrl -replace '.*github.com[:/]([^.]*).*', '$1'
Write-Host "Repository: $repoName" -ForegroundColor Cyan

# Get AWS credentials
$AccessKeyId = aws configure get aws_access_key_id --profile $ProfileName
$SecretAccessKey = aws configure get aws_secret_access_key --profile $ProfileName

# Get Terraform outputs
$LambdaRoleArn = terraform output -raw lambda_execution_role_arn
$UsersTableName = terraform output -raw users_table_name
$SessionsTableName = terraform output -raw sessions_table_name
$JwtSecretName = terraform output -raw jwt_secret_name
$AwsRegion = terraform output -raw aws_region

Write-Host "Setting up GitHub secrets..." -ForegroundColor Cyan

# Set GitHub secrets
gh secret set AWS_ACCESS_KEY_ID --body $AccessKeyId --repo $repoName
Write-Host "Set AWS_ACCESS_KEY_ID" -ForegroundColor Green

gh secret set AWS_SECRET_ACCESS_KEY --body $SecretAccessKey --repo $repoName
Write-Host "Set AWS_SECRET_ACCESS_KEY" -ForegroundColor Green

gh secret set AWS_LAMBDA_ROLE_ARN --body $LambdaRoleArn --repo $repoName
Write-Host "Set AWS_LAMBDA_ROLE_ARN" -ForegroundColor Green

gh secret set USERS_TABLE_NAME --body $UsersTableName --repo $repoName
Write-Host "Set USERS_TABLE_NAME" -ForegroundColor Green

gh secret set SESSIONS_TABLE_NAME --body $SessionsTableName --repo $repoName
Write-Host "Set SESSIONS_TABLE_NAME" -ForegroundColor Green

gh secret set JWT_SECRET_NAME --body $JwtSecretName --repo $repoName
Write-Host "Set JWT_SECRET_NAME" -ForegroundColor Green

gh secret set AWS_REGION --body $AwsRegion --repo $repoName
Write-Host "Set AWS_REGION" -ForegroundColor Green

Write-Host "All GitHub secrets have been set successfully!" -ForegroundColor Green

# Go back to project root
Set-Location ..
