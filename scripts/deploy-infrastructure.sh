#!/bin/bash

# Deploy Infrastructure Script
# This script deploys the AWS infrastructure using Terraform

set -e

echo "🚀 Deploying Peptide Tracker Infrastructure..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Navigate to infrastructure directory
cd infrastructure

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "⚠️  terraform.tfvars not found. Creating from example..."
    cp terraform.tfvars.example terraform.tfvars
    echo "📝 Please edit terraform.tfvars with your preferred settings"
fi

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Plan the deployment
echo "📋 Planning infrastructure deployment..."
terraform plan

# Ask for confirmation
read -p "🤔 Do you want to apply these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Apply the infrastructure
    echo "🏗️  Applying infrastructure..."
    terraform apply -auto-approve
    
    # Show outputs
    echo "✅ Infrastructure deployed successfully!"
    echo ""
    echo "📋 Infrastructure Summary:"
    terraform output infrastructure_summary
    
    echo ""
    echo "🔐 GitHub Secrets to Add:"
    terraform output github_secrets
    
    echo ""
    echo "🎉 Next steps:"
    echo "1. Add the GitHub secrets to your repository"
    echo "2. Push your Lambda code to trigger deployment"
    echo "3. Test your API endpoints"
    
else
    echo "❌ Deployment cancelled."
    exit 1
fi
