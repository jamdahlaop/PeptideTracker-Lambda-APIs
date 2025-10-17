# Infrastructure Project TODO

## Project Setup
Create a new separate repository for AWS infrastructure management using Terraform.

## Required Infrastructure Components

### 1. API Gateway Configuration
- [ ] **Main API Gateway** (`aws_api_gateway_rest_api`)
- [ ] **API Gateway Deployment** (`aws_api_gateway_deployment`)
- [ ] **API Gateway Stage** (`aws_api_gateway_stage`) - `dev` and `prod`

### 2. API Gateway Resources & Methods
- [ ] **Hello World Endpoint**
  - Resource: `/hello`
  - Method: `GET`
  - Integration: `AWS_PROXY` → `peptide-tracker-hello-world-dev`

- [ ] **Auth Endpoints**
  - Resource: `/auth/register`
  - Method: `POST`
  - Integration: `AWS_PROXY` → `peptide-tracker-auth-register-dev`
  
  - Resource: `/auth/login`
  - Method: `POST`
  - Integration: `AWS_PROXY` → `peptide-tracker-auth-login-dev`
  
  - Resource: `/auth/verify`
  - Method: `GET`
  - Integration: `AWS_PROXY` → `peptide-tracker-auth-verify-dev`

- [ ] **Credential Validator Endpoint** ⭐ **NEW**
  - Resource: `/credential-validator`
  - Method: `POST`
  - Integration: `AWS_PROXY` → `peptide-tracker-credential-validator-dev`

### 3. Lambda Permissions
- [ ] **API Gateway Invoke Permissions** for each Lambda:
  - `peptide-tracker-hello-world-dev`
  - `peptide-tracker-auth-register-dev`
  - `peptide-tracker-auth-login-dev`
  - `peptide-tracker-auth-verify-dev`
  - `peptide-tracker-credential-validator-dev` ⭐ **NEW**

### 4. CloudWatch Log Groups
- [ ] **Log Groups** for each Lambda function:
  - `/aws/lambda/peptide-tracker-hello-world-dev`
  - `/aws/lambda/peptide-tracker-auth-register-dev`
  - `/aws/lambda/peptide-tracker-auth-login-dev`
  - `/aws/lambda/peptide-tracker-auth-verify-dev`
  - `/aws/lambda/peptide-tracker-credential-validator-dev` ⭐ **NEW**

### 5. IAM Roles & Policies
- [ ] **Lambda Execution Role** (`peptide-tracker-lambda-execution-role`)
- [ ] **GitHub Actions OIDC Role** for CI/CD
- [ ] **API Gateway Service Role** (if needed)

### 6. Variables & Configuration
- [ ] **Terraform Variables**:
  - `aws_region` (default: `us-east-1`)
  - `environment` (dev/prod)
  - `project_name` (peptide-tracker)
- [ ] **Environment-specific tfvars files**
- [ ] **Outputs**:
  - API Gateway URL
  - Lambda function ARNs
  - IAM role ARNs

### 7. GitHub Actions Integration
- [ ] **OIDC Configuration** for GitHub Actions
- [ ] **Secrets Management**:
  - `AWS_GITHUB_ACTIONS_ROLE_ARN`
  - `AWS_LAMBDA_ROLE_ARN`
- [ ] **Workflow for Infrastructure Deployment**

## Current API Gateway Details
- **API Gateway ID**: `7v2du6tsqk`
- **Current URL**: `https://7v2du6tsqk.execute-api.us-east-1.amazonaws.com/dev`
- **Region**: `us-east-1`
- **Account ID**: `132141655881`

## Lambda Functions to Reference (Not Deploy)
The infrastructure should reference existing Lambda functions, not create them:

1. `peptide-tracker-hello-world-dev` ✅ (exists)
2. `peptide-tracker-credential-validator-dev` ✅ (exists)
3. `peptide-tracker-auth-register-dev` (to be created)
4. `peptide-tracker-auth-login-dev` (to be created)
5. `peptide-tracker-auth-verify-dev` (to be created)

## Key Principles
- **Infrastructure as Code**: All resources defined in Terraform
- **Separation of Concerns**: Infrastructure ≠ Application Code
- **Environment Parity**: Same structure for dev/prod
- **Automated Deployment**: GitHub Actions for infrastructure updates
- **Security**: Proper IAM roles and least privilege access

## Files to Create
```
infrastructure/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── api-gateway.tf          # API Gateway resources
├── lambda-permissions.tf   # Lambda invoke permissions
├── iam.tf                  # IAM roles and policies
├── cloudwatch.tf           # Log groups
├── github-oidc.tf          # GitHub Actions OIDC
├── terraform.tfvars        # Environment variables
├── terraform.tfvars.example
└── README.md               # Documentation
```

## Next Steps
1. Create new repository for infrastructure
2. Set up Terraform configuration
3. Deploy infrastructure
4. Update Lambda project to remove infrastructure files
5. Test end-to-end functionality
