#!/bin/bash

# Enhanced Complete Deployment Script
# This script uses the local Terraform setup for better credential management

set -e

echo "🚀 Starting enhanced Peptide Tracker deployment..."

# Check if we're in the right directory
if [ ! -d "infrastructure" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Step 1: Setup Local Environment
echo "🔧 Step 1: Setting up local environment..."
chmod +x scripts/setup-local-environment.sh
./scripts/setup-local-environment.sh

# Step 2: Deploy Infrastructure
echo ""
echo "🏗️  Step 2: Deploying AWS Infrastructure..."
cd infrastructure

# Use local configuration if available
if [ -f "local.tfvars" ]; then
    echo "📋 Using local configuration..."
    terraform apply -var-file="local.tfvars" -auto-approve
else
    echo "📋 Using default configuration..."
    terraform apply -auto-approve
fi

echo "✅ Infrastructure deployed successfully!"

# Step 3: Setup GitHub Secrets
echo ""
echo "🔐 Step 3: Setting up GitHub secrets..."

# Go back to project root
cd ..

# Run the GitHub secrets setup script
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh

# Step 4: Test the deployment
echo ""
echo "🧪 Step 4: Testing the deployment..."

# Make a small test change
echo "📝 Making a test change to trigger deployment..."
echo "// Enhanced deployment test - $(date)" >> src/hello-world/index.ts

# Commit and push
git add .
git commit -m "Test enhanced deployment pipeline - $(date)"
git push

echo ""
echo "🎉 Enhanced deployment initiated!"
echo ""
echo "📋 What was deployed:"
echo "   ✅ Local Environment Setup (credential validation)"
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
