#!/bin/bash

# Complete Deployment Script
# This script deploys infrastructure and sets up GitHub secrets automatically

set -e

echo "🚀 Starting complete Peptide Tracker deployment..."

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    echo "   Visit: https://www.terraform.io/downloads.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

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

# Step 1: Deploy Infrastructure
echo ""
echo "🏗️  Step 1: Deploying AWS Infrastructure..."
cd infrastructure

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "📝 Creating terraform.tfvars from example..."
    cp terraform.tfvars.example terraform.tfvars
    echo "✅ Created terraform.tfvars (using default values)"
fi

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Plan the deployment
echo "📋 Planning infrastructure deployment..."
terraform plan

# Ask for confirmation
echo ""
read -p "🤔 Do you want to deploy the infrastructure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Infrastructure deployment cancelled."
    exit 1
fi

# Apply the infrastructure
echo "🏗️  Deploying infrastructure..."
terraform apply -auto-approve

echo "✅ Infrastructure deployed successfully!"

# Step 2: Setup GitHub Secrets
echo ""
echo "🔐 Step 2: Setting up GitHub secrets..."

# Go back to project root
cd ..

# Run the GitHub secrets setup script
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh

# Step 3: Test the deployment
echo ""
echo "🧪 Step 3: Testing the deployment..."

# Make a small test change
echo "📝 Making a test change to trigger deployment..."
echo "// Test deployment - $(date)" >> src/hello-world/index.ts

# Commit and push
git add .
git commit -m "Test complete deployment pipeline - $(date)"
git push

echo ""
echo "🎉 Complete deployment initiated!"
echo ""
echo "📋 What was deployed:"
echo "   ✅ AWS Infrastructure (DynamoDB, Secrets Manager, IAM, API Gateway)"
echo "   ✅ GitHub Secrets (AWS credentials and resource names)"
echo "   ✅ Lambda Functions (via GitHub Actions)"
echo ""
echo "🔍 Monitor your deployment:"
echo "   GitHub Actions: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo ""
echo "⏱️  The GitHub Actions workflow will now:"
echo "   1. Build your TypeScript code"
echo "   2. Create deployment packages"
echo "   3. Deploy Lambda functions to AWS"
echo "   4. Configure API Gateway endpoints"
echo ""
echo "🎯 Your API will be available at the URL shown in the Terraform outputs!"
