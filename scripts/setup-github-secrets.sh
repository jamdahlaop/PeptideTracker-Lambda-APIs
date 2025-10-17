#!/bin/bash

# Setup GitHub Secrets Script
# This script automatically sets up GitHub secrets from Terraform outputs

set -e

echo "🔐 Setting up GitHub secrets from Terraform outputs..."

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "   Visit: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated. Please run 'gh auth login' first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "infrastructure" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Navigate to infrastructure directory
cd infrastructure

# Check if terraform has been applied
if [ ! -f "terraform.tfstate" ]; then
    echo "❌ Terraform state not found. Please run 'terraform apply' first."
    exit 1
fi

# Set AWS profile for terraform commands
export AWS_PROFILE=${AWS_PROFILE:-peptide-tracker}
echo "🔧 Using AWS profile: $AWS_PROFILE"

# Get the repository name from git remote
REPO_NAME=$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')
echo "📋 Repository: $REPO_NAME"

# Get Terraform outputs
echo "📦 Getting Terraform outputs..."

# Get AWS profile from environment or use peptide-tracker
AWS_PROFILE=${AWS_PROFILE:-peptide-tracker}

# Get AWS credentials from the specified profile
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-$(aws configure get aws_access_key_id --profile $AWS_PROFILE)}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-$(aws configure get aws_secret_access_key --profile $AWS_PROFILE)}

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    echo "   Or configure AWS CLI with 'aws configure'"
    exit 1
fi

# Get other values from Terraform
LAMBDA_ROLE_ARN=$(terraform output -raw lambda_execution_role_arn)
USERS_TABLE_NAME=$(terraform output -raw users_table_name)
SESSIONS_TABLE_NAME=$(terraform output -raw sessions_table_name)
JWT_SECRET_NAME=$(terraform output -raw jwt_secret_name)
AWS_REGION=$(terraform output -raw aws_region)

echo "🔑 Setting up GitHub secrets..."

# Set GitHub secrets
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID" --repo "$REPO_NAME"
echo "✅ Set AWS_ACCESS_KEY_ID"

gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY" --repo "$REPO_NAME"
echo "✅ Set AWS_SECRET_ACCESS_KEY"

gh secret set AWS_LAMBDA_ROLE_ARN --body "$LAMBDA_ROLE_ARN" --repo "$REPO_NAME"
echo "✅ Set AWS_LAMBDA_ROLE_ARN"

gh secret set USERS_TABLE_NAME --body "$USERS_TABLE_NAME" --repo "$REPO_NAME"
echo "✅ Set USERS_TABLE_NAME"

gh secret set SESSIONS_TABLE_NAME --body "$SESSIONS_TABLE_NAME" --repo "$REPO_NAME"
echo "✅ Set SESSIONS_TABLE_NAME"

gh secret set JWT_SECRET_NAME --body "$JWT_SECRET_NAME" --repo "$REPO_NAME"
echo "✅ Set JWT_SECRET_NAME"

gh secret set AWS_REGION --body "$AWS_REGION" --repo "$REPO_NAME"
echo "✅ Set AWS_REGION"

echo ""
echo "🎉 All GitHub secrets have been set successfully!"
echo ""
echo "📋 Secrets configured:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - AWS_LAMBDA_ROLE_ARN"
echo "   - USERS_TABLE_NAME"
echo "   - SESSIONS_TABLE_NAME"
echo "   - JWT_SECRET_NAME"
echo "   - AWS_REGION"
echo ""
echo "🚀 Next steps:"
echo "   1. Push a change to trigger the GitHub Actions workflow"
echo "   2. Check the Actions tab to see your Lambda functions deploy"
echo "   3. Test your API endpoints"
echo ""
echo "🔍 Monitor deployment:"
echo "   https://github.com/$REPO_NAME/actions"
