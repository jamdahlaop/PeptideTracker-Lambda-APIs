# Peptide Tracker Lambda APIs

This repository contains AWS Lambda functions for the Peptide Tracker application, configured for Git-based deployment using GitHub Actions.

## Project Structure

```
├── src/
│   ├── auth_service/          # Authentication service Lambda function
│   │   ├── index.ts          # Main Lambda handler
│   │   ├── package.json      # Dependencies and scripts
│   │   └── tsconfig.json     # TypeScript configuration
│   └── hello-world/          # Simple Hello World Lambda function
│       ├── index.ts          # Main Lambda handler
│       ├── package.json      # Dependencies and scripts
│       └── tsconfig.json     # TypeScript configuration
├── infrastructure/           # Terraform infrastructure as code
│   ├── main.tf              # Main infrastructure configuration
│   ├── variables.tf         # Terraform variables
│   ├── outputs.tf           # Terraform outputs
│   ├── api-gateway.tf       # API Gateway configuration
│   └── README.md            # Infrastructure documentation
├── scripts/                 # Utility scripts
│   ├── deploy-infrastructure.sh # Infrastructure deployment script
│   ├── build-all.js         # Build all Lambda functions
│   └── test-local.js        # Local testing script
├── .github/
│   └── workflows/
│       └── deploy-lambda.yml # GitHub Actions CI/CD workflow
└── README.md                 # This file
```

## Lambda Functions

### 1. Hello World Lambda
- **Purpose**: Simple demonstration Lambda function
- **Runtime**: Node.js 18.x
- **Handler**: `index.handler`
- **Endpoints**: Returns a JSON response with request information

### 2. Auth Service Lambda
- **Purpose**: Authentication and user management service
- **Runtime**: Node.js 18.x
- **Handler**: `index.handler`
- **Features**:
  - User registration and login
  - JWT token generation and verification
  - Password hashing with bcrypt
  - Session management
  - Integration with DynamoDB and AWS Secrets Manager

## Infrastructure as Code (Terraform)

This project uses Terraform to manage all AWS infrastructure, ensuring consistent and reproducible deployments.

### Quick Infrastructure Setup

1. **Deploy Infrastructure**:
   ```bash
   cd infrastructure
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your settings
   terraform init
   terraform apply
   ```

2. **Get GitHub Secrets**:
   ```bash
   terraform output github_secrets
   ```

3. **Add secrets to GitHub repository** (see GitHub Secrets section below)

### What Gets Created

- **DynamoDB Tables**: Users and sessions storage
- **AWS Secrets Manager**: JWT signing secret
- **IAM Roles & Policies**: Lambda execution permissions
- **API Gateway**: REST API endpoints
- **CloudWatch Logs**: Function logging

## Git-Based Deployment Process

This project uses GitHub Actions for automated CI/CD deployment to AWS Lambda. Here's how it works:

### 1. Repository Setup

1. **Initialize Git Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Add Lambda functions with TypeScript source code"
   ```

2. **Create GitHub Repository**:
   - Create a new repository on GitHub
   - Add the remote origin:
   ```bash
   git remote add origin https://github.com/yourusername/peptide-tracker-lambda-apis.git
   git push -u origin main
   ```

### 2. AWS Configuration

Before deployment, you need to configure AWS credentials and resources:

#### AWS Credentials (GitHub Secrets)
Add these secrets to your GitHub repository settings:

- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_LAMBDA_ROLE_ARN`: IAM role ARN for Lambda execution

#### AWS Resources
The auth service requires these AWS resources:

1. **DynamoDB Tables**:
   - `peptide-tracker-users`: User data storage
   - `peptide-tracker-sessions`: Session management

2. **AWS Secrets Manager**:
   - `peptide-tracker/jwt-secret`: JWT signing secret

3. **IAM Role**: Lambda execution role with permissions for:
   - DynamoDB read/write access
   - Secrets Manager read access
   - CloudWatch Logs write access

### 3. Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy-lambda.yml`) automatically:

1. **On Pull Request**:
   - Runs tests and builds
   - Validates code without deploying

2. **On Push to Main/Master**:
   - Runs tests and builds
   - Creates deployment packages
   - Deploys to AWS Lambda

### 4. Local Development

#### Prerequisites
- Node.js 18.x or later
- npm or yarn
- TypeScript

#### Setup
```bash
# Install dependencies for auth service
cd src/auth_service
npm install

# Install dependencies for hello-world service
cd ../hello-world
npm install
```

#### Build
```bash
# Build auth service
cd src/auth_service
npm run build

# Build hello-world service
cd ../hello-world
npm run build
```

#### Test Locally
```bash
# Test auth service
cd src/auth_service
node test-local.js

# Test hello-world service
cd ../hello-world
node -e "const { handler } = require('./build/index.js'); handler({}).then(console.log)"
```

### 5. Manual Deployment

If you need to deploy manually:

```bash
# Build and package
cd src/hello-world
npm run build
mkdir -p deployment
cp -r build/* deployment/
cp package.json deployment/
cd deployment
npm install --production
zip -r hello-world-lambda.zip .

# Deploy to AWS
aws lambda update-function-code \
  --function-name hello-world-lambda \
  --zip-file fileb://hello-world-lambda.zip \
  --region us-east-1
```

## Environment Variables

### Auth Service
- `USERS_TABLE_NAME`: DynamoDB table for user data
- `SESSIONS_TABLE_NAME`: DynamoDB table for session data
- `JWT_SECRET_NAME`: AWS Secrets Manager secret name for JWT signing

## API Endpoints

### Auth Service
- `POST /auth/register`: User registration
- `POST /auth/login`: User login
- `GET /auth/verify`: Token verification

### Hello World Service
- `GET /`: Returns hello world message with request details

## Monitoring and Logs

- **CloudWatch Logs**: All Lambda functions log to CloudWatch
- **GitHub Actions**: Build and deployment logs available in GitHub Actions tab
- **AWS Lambda Console**: Monitor function performance and errors

## Security Considerations

1. **Secrets Management**: JWT secrets stored in AWS Secrets Manager
2. **IAM Roles**: Least privilege access for Lambda functions
3. **Environment Variables**: Sensitive data not stored in code
4. **HTTPS**: All API Gateway endpoints use HTTPS

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

2. **Deployment Failures**:
   - Verify AWS credentials are correct
   - Check IAM role permissions
   - Ensure Lambda function names don't conflict

3. **Runtime Errors**:
   - Check CloudWatch logs for detailed error messages
   - Verify environment variables are set correctly
   - Check AWS service permissions

### Getting Help

1. Check GitHub Actions logs for build/deployment issues
2. Review CloudWatch logs for runtime errors
3. Verify AWS resource configuration
4. Check IAM permissions and policies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

The GitHub Actions workflow will automatically test your changes before they can be merged.

## License

MIT License - see LICENSE file for details.
