# PowerShell script to add a new Lambda function to the infrastructure
# Usage: .\scripts\add-lambda-to-infrastructure.ps1 -FunctionName "user-profile" -HttpMethod "GET" -ApiPath "/users/profile"

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("GET", "POST", "PUT", "DELETE", "PATCH")]
    [string]$HttpMethod,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiPath,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "Lambda function for $FunctionName"
)

Write-Host "Adding Lambda function to infrastructure: $FunctionName" -ForegroundColor Green
Write-Host "HTTP Method: $HttpMethod" -ForegroundColor Cyan
Write-Host "API Path: $ApiPath" -ForegroundColor Cyan
Write-Host "Description: $Description" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
if ($ApiPath -notmatch '^/') {
    Write-Host "Error: API path must start with '/'" -ForegroundColor Red
    exit 1
}

# Check if function already exists in infrastructure
$infrastructureFile = "infrastructure/lambda-api-gateway.tf"
if (-not (Test-Path $infrastructureFile)) {
    Write-Host "Error: Infrastructure file not found: $infrastructureFile" -ForegroundColor Red
    exit 1
}

# Read the current infrastructure file
$content = Get-Content $infrastructureFile -Raw

# Check if function already exists
if ($content -match "`"$FunctionName`"") {
    Write-Host "Error: Function '$FunctionName' already exists in infrastructure" -ForegroundColor Red
    exit 1
}

# Create the new function configuration
$newFunctionConfig = @"
    "$FunctionName" = {
      http_method = "$HttpMethod"
      api_path    = "$ApiPath"
      description = "$Description"
    }
"@

# Find the lambda_functions block and add the new function
$pattern = '(\s+lambda_functions = \{[^}]*)(\s+\})'
if ($content -match $pattern) {
    $beforeBlock = $matches[1]
    $afterBlock = $matches[2]
    
    # Add the new function configuration
    $newContent = $beforeBlock + "`n" + $newFunctionConfig + $afterBlock
    
    # Replace the content
    $content = $content -replace [regex]::Escape($matches[0]), $newContent
    
    # Write the updated content back to the file
    Set-Content $infrastructureFile $content
    
    Write-Host "✅ Successfully added '$FunctionName' to infrastructure!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: terraform plan -target=aws_lambda_function.lambda_functions" -ForegroundColor White
    Write-Host "2. Run: terraform apply -target=aws_lambda_function.lambda_functions" -ForegroundColor White
    Write-Host "3. Update GitHub Actions workflow if needed" -ForegroundColor White
    Write-Host "4. Test the new API endpoint" -ForegroundColor White
    Write-Host ""
    Write-Host "API Endpoint will be available at:" -ForegroundColor Yellow
    Write-Host "  $HttpMethod $ApiPath" -ForegroundColor White
    Write-Host ""
    Write-Host "To deploy the infrastructure changes:" -ForegroundColor Cyan
    Write-Host "  cd infrastructure" -ForegroundColor White
    Write-Host "  terraform plan" -ForegroundColor White
    Write-Host "  terraform apply" -ForegroundColor White
    
} else {
    Write-Host "Error: Could not find lambda_functions block in infrastructure file" -ForegroundColor Red
    exit 1
}
