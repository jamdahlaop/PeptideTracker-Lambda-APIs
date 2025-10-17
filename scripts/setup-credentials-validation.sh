#!/bin/bash

# Setup Credentials Validation Script
# This script validates AWS and GitHub credentials and sets up the development environment

set -e

echo "🔧 Setting up credentials validation and development environment..."

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    echo "   Visit: https://www.terraform.io/downloads.html"
    exit 1
fi

# Check if AWS CLI is configured (try peptide-tracker profile first)
AWS_PROFILE=${AWS_PROFILE:-peptide-tracker}
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
    echo "❌ AWS CLI is not configured for profile '$AWS_PROFILE'."
    echo "   Please run: ./scripts/setup-aws-profile.sh"
    echo "   Or configure manually: aws configure --profile peptide-tracker"
    exit 1
fi

echo "✅ Using AWS profile: $AWS_PROFILE"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "   Visit: https://cli.github.com/"
    exit 1
fi

# Check if GitHub CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated. Please run 'gh auth login' first."
    exit 1
fi

echo "✅ All prerequisites met!"

# Navigate to infrastructure directory
cd infrastructure

# Check if credentials.tfvars exists
if [ ! -f "credentials.tfvars" ]; then
    echo "📝 Creating credentials.tfvars from example..."
    cp credentials.tfvars.example credentials.tfvars
    echo "✅ Created credentials.tfvars (using default values)"
    echo "📝 You can edit credentials.tfvars to customize your setup"
fi

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Validate the configuration
echo "🔍 Validating Terraform configuration..."
terraform validate

# Plan the credentials validation setup
echo "📋 Planning credentials validation setup..."
terraform plan -var-file="credentials.tfvars" -target=null_resource.validate_aws_credentials

# Ask for confirmation
echo ""
read -p "🤔 Do you want to validate your AWS and GitHub credentials? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled."
    exit 1
fi

# Apply the validation
echo "🔍 Validating credentials..."
terraform apply -var-file="credentials.tfvars" -target=null_resource.validate_aws_credentials -auto-approve
terraform apply -var-file="credentials.tfvars" -target=null_resource.validate_github_auth -auto-approve

# Apply the full credentials setup
echo "🏗️  Setting up credentials validation environment..."
terraform apply -var-file="credentials.tfvars" -auto-approve

echo ""
echo "✅ Local environment setup complete!"
echo ""
echo "📋 Setup Summary:"
terraform output local_setup_info

echo ""
echo "🚀 Next steps:"
echo "   1. Run: ./scripts/deploy-complete.sh"
echo "   2. Or run: npm run deploy:complete"
echo ""
echo "🔍 Your configuration:"
echo "   - AWS Account: $(aws sts get-caller-identity --query Account --output text)"
echo "   - AWS Region: $(aws configure get region)"
echo "   - GitHub User: $(gh api user --jq .login)"
echo "   - Repository: jamdahlaop/PeptideTracker-Lambda-APIs"
