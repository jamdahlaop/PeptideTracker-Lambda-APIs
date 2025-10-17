#!/bin/bash

# Setup AWS Profile Script
# This script helps set up a dedicated AWS profile for the Peptide Tracker project

set -e

echo "🔧 Setting up AWS profile for Peptide Tracker..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://aws.amazon.com/cli/"
    exit 1
fi

PROFILE_NAME="peptide-tracker"

echo "📋 Setting up AWS profile: $PROFILE_NAME"
echo ""

# Check if profile already exists
if aws configure list-profiles | grep -q "^$PROFILE_NAME$"; then
    echo "⚠️  Profile '$PROFILE_NAME' already exists."
    read -p "🤔 Do you want to reconfigure it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Using existing profile '$PROFILE_NAME'"
        exit 0
    fi
fi

echo "🔑 Please provide your AWS credentials for the Peptide Tracker project:"
echo ""

# Get AWS credentials
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Default region (us-east-1): " AWS_DEFAULT_REGION
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

# Configure the profile
echo ""
echo "📝 Configuring AWS profile '$PROFILE_NAME'..."

aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID" --profile "$PROFILE_NAME"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY" --profile "$PROFILE_NAME"
aws configure set default.region "$AWS_DEFAULT_REGION" --profile "$PROFILE_NAME"
aws configure set default.output json --profile "$PROFILE_NAME"

echo "✅ AWS profile '$PROFILE_NAME' configured successfully!"

# Test the profile
echo ""
echo "🔍 Testing the profile..."
if aws sts get-caller-identity --profile "$PROFILE_NAME" &> /dev/null; then
    echo "✅ Profile test successful!"
    
    # Show account info
    ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE_NAME" --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --profile "$PROFILE_NAME" --query Arn --output text)
    
    echo ""
    echo "📋 Profile Information:"
    echo "   Profile Name: $PROFILE_NAME"
    echo "   Account ID: $ACCOUNT_ID"
    echo "   User/Role: $USER_ARN"
    echo "   Region: $AWS_DEFAULT_REGION"
    
    # Create a profile configuration file
    cat > aws-profile-config.env << EOF
# AWS Profile Configuration for Peptide Tracker
# Generated on $(date)

export AWS_PROFILE=peptide-tracker
export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
export AWS_REGION=$AWS_DEFAULT_REGION

# Profile-specific environment variables
export PEPTIDE_TRACKER_PROFILE=$PROFILE_NAME
export PEPTIDE_TRACKER_ACCOUNT_ID=$ACCOUNT_ID
EOF

    echo ""
    echo "📝 Created aws-profile-config.env file"
    echo "   You can source this file to use the profile: source aws-profile-config.env"
    
else
    echo "❌ Profile test failed. Please check your credentials."
    exit 1
fi

echo ""
echo "🎉 AWS profile setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Source the profile: source aws-profile-config.env"
echo "   2. Run: npm run setup:local"
echo "   3. Run: npm run deploy:enhanced"
echo ""
echo "💡 Tip: You can also use the profile directly:"
echo "   aws s3 ls --profile peptide-tracker"
