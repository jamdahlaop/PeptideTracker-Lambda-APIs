# PowerShell script to create a new Lambda function from template
# Usage: .\scripts\create-lambda-function.ps1 -FunctionName "user-profile" -Description "User profile management"

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "Lambda function for $FunctionName",
    
    [Parameter(Mandatory=$false)]
    [string]$HttpMethod = "GET",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiPath = "/$FunctionName"
)

Write-Host "Creating new Lambda function: $FunctionName" -ForegroundColor Green
Write-Host "Description: $Description" -ForegroundColor Cyan
Write-Host "HTTP Method: $HttpMethod" -ForegroundColor Cyan
Write-Host "API Path: $ApiPath" -ForegroundColor Cyan
Write-Host ""

# Validate function name (no spaces, lowercase, hyphens allowed)
if ($FunctionName -match '[^a-z0-9-]') {
    Write-Host "Error: Function name must contain only lowercase letters, numbers, and hyphens" -ForegroundColor Red
    exit 1
}

# Check if function already exists
$functionPath = "src/$FunctionName"
if (Test-Path $functionPath) {
    Write-Host "Error: Function '$FunctionName' already exists at $functionPath" -ForegroundColor Red
    exit 1
}

# Create function directory
Write-Host "Creating function directory: $functionPath" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $functionPath -Force | Out-Null
New-Item -ItemType Directory -Path "$functionPath/src" -Force | Out-Null

# Copy template files
Write-Host "Copying template files..." -ForegroundColor Yellow
Copy-Item "src/lambda-template/package.json" "$functionPath/package.json"
Copy-Item "src/lambda-template/tsconfig.json" "$functionPath/tsconfig.json"
Copy-Item "src/lambda-template/src/index.ts" "$functionPath/src/index.ts"

# Update package.json
Write-Host "Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "$functionPath/package.json" | ConvertFrom-Json
$packageJson.name = $FunctionName
$packageJson.description = $Description
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "$functionPath/package.json"

# Update index.ts
Write-Host "Updating index.ts..." -ForegroundColor Yellow
$indexContent = Get-Content "$functionPath/src/index.ts" -Raw
$indexContent = $indexContent -replace 'lambda-template', $FunctionName
$indexContent = $indexContent -replace 'Lambda Template!', "$Description!"
$indexContent = $indexContent -replace 'functionName: ''lambda-template''', "functionName: '$FunctionName'"
Set-Content "$functionPath/src/index.ts" $indexContent

# Create .gitignore for the function
Write-Host "Creating .gitignore..." -ForegroundColor Yellow
@"
# Build output
build/
*.js.map
*.d.ts.map

# Dependencies
node_modules/

# Environment files
.env
.env.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
"@ | Set-Content "$functionPath/.gitignore"

Write-Host ""
Write-Host "✅ Lambda function '$FunctionName' created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Implement your business logic in: src/$FunctionName/src/index.ts" -ForegroundColor White
Write-Host "2. Add any required environment variables to the GitHub Actions workflow" -ForegroundColor White
Write-Host "3. Update API Gateway configuration in infrastructure/" -ForegroundColor White
Write-Host "4. Test locally: cd src/$FunctionName && npm install && npm run build" -ForegroundColor White
Write-Host "5. Commit and push to trigger deployment" -ForegroundColor White
Write-Host ""
Write-Host "API Configuration:" -ForegroundColor Cyan
Write-Host "  Method: $HttpMethod" -ForegroundColor White
Write-Host "  Path: $ApiPath" -ForegroundColor White
Write-Host "  Function: $FunctionName" -ForegroundColor White
Write-Host ""
Write-Host "To add this function to the deployment workflow, you'll need to:" -ForegroundColor Yellow
Write-Host "1. Add it to .github/workflows/deploy-lambda.yml" -ForegroundColor White
Write-Host "2. Add API Gateway configuration in infrastructure/" -ForegroundColor White
