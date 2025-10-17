# Infrastructure Project TODO List

## 🎯 **Project Goal**
Create a separate infrastructure repository to manage AWS resources using Terraform, while Lambda functions are deployed from the main Lambda project.

## 📋 **Current Status**
- ✅ **Lambda Functions**: `hello-world` and `credential-validator` are deployed and working
- ✅ **API Gateway**: Basic structure exists with `/hello` endpoint working
- ❌ **Missing**: `/credential-validator` endpoint in API Gateway
- ❌ **Missing**: Lambda-to-Lambda invocation permissions
- ❌ **Missing**: Proper IAM roles and policies

## 🏗️ **Infrastructure Components to Create**

### 1. **API Gateway Configuration**
- [ ] **Main API Gateway** (`aws_api_gateway_rest_api`)
- [ ] **API Gateway Deployment** (`aws_api_gateway_deployment`)
- [ ] **API Gateway Stage** (`aws_api_gateway_stage`) - `dev` and `prod`

### 2. **API Gateway Resources & Methods**
- [ ] **Hello World Endpoint**
  - Resource: `/hello`
  - Method: `GET`
  - Integration: `AWS_PROXY` → `peptide-tracker-hello-world-dev`

- [ ] **Credential Validator Endpoint** ⭐ **PRIORITY**
  - Resource: `/credential-validator`
  - Method: `POST`
  - Integration: `AWS_PROXY` → `peptide-tracker-credential-validator-dev`

- [ ] **Auth Endpoints** (Future)
  - Resource: `/auth/register`
  - Method: `POST`
  - Integration: `AWS_PROXY` → `peptide-tracker-auth-register-dev`
  
  - Resource: `/auth/login`
  - Method: `POST`
  - Integration: `AWS_PROXY` → `peptide-tracker-auth-login-dev`
  
  - Resource: `/auth/verify`
  - Method: `GET`
  - Integration: `AWS_PROXY` → `peptide-tracker-auth-verify-dev`

### 3. **Lambda Permissions** ⭐ **CRITICAL**
- [ ] **API Gateway Invoke Permissions** for each Lambda:
  - `peptide-tracker-hello-world-dev`
  - `peptide-tracker-credential-validator-dev`
  - `peptide-tracker-auth-register-dev` (future)
  - `peptide-tracker-auth-login-dev` (future)
  - `peptide-tracker-auth-verify-dev` (future)

- [ ] **Lambda-to-Lambda Invoke Permissions** ⭐ **CRITICAL**
  - Allow `credential-validator` to invoke other Lambda functions
  - Policy: `lambda:InvokeFunction` on `arn:aws:lambda:us-east-1:132141655881:function:peptide-tracker-*`

### 4. **IAM Roles & Policies**
- [ ] **Lambda Execution Role** (`peptide-tracker-lambda-execution-role`)
  - Basic execution permissions
  - Lambda-to-Lambda invocation permissions
  - CloudWatch logs permissions

- [ ] **GitHub Actions OIDC Role** for CI/CD
  - Assume role permissions for GitHub Actions
  - Lambda deployment permissions

- [ ] **API Gateway Service Role** (if needed)

### 5. **CloudWatch Log Groups**
- [ ] **Log Groups** for each Lambda function:
  - `/aws/lambda/peptide-tracker-hello-world-dev`
  - `/aws/lambda/peptide-tracker-credential-validator-dev`
  - `/aws/lambda/peptide-tracker-auth-register-dev` (future)
  - `/aws/lambda/peptide-tracker-auth-login-dev` (future)
  - `/aws/lambda/peptide-tracker-auth-verify-dev` (future)

### 6. **Variables & Configuration**
- [ ] **Terraform Variables**:
  - `aws_region` (default: `us-east-1`)
  - `environment` (dev/prod)
  - `project_name` (peptide-tracker)
  - `account_id` (132141655881)

- [ ] **Environment-specific tfvars files**
- [ ] **Outputs**:
  - API Gateway URL
  - Lambda function ARNs
  - IAM role ARNs

### 7. **GitHub Actions Integration**
- [ ] **OIDC Configuration** for GitHub Actions
- [ ] **Secrets Management**:
  - `AWS_GITHUB_ACTIONS_ROLE_ARN`
  - `AWS_LAMBDA_ROLE_ARN`
- [ ] **Workflow for Infrastructure Deployment**

## 🔧 **Current Issues to Fix**

### **Issue 1: Missing API Gateway Endpoint**
- **Problem**: `/credential-validator` endpoint not configured in API Gateway
- **Solution**: Add resource, method, and integration in Terraform
- **Status**: ❌ Not implemented

### **Issue 2: Lambda-to-Lambda Permissions**
- **Problem**: `credential-validator` can't invoke `hello-world`
- **Error**: `User: arn:aws:sts::132141655881:assumed-role/peptide-tracker-lambda-execution-role/peptide-tracker-credential-validator-dev is not authorized to perform: lambda:InvokeFunction`
- **Solution**: Add `lambda:InvokeFunction` permission to IAM role
- **Status**: ⚠️ Manually fixed, needs Terraform implementation

### **Issue 3: Infrastructure Separation**
- **Problem**: Infrastructure files mixed with Lambda code
- **Solution**: Create separate infrastructure repository
- **Status**: ❌ Not implemented

## 📁 **File Structure to Create**
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

## 🚀 **Implementation Priority**

### **Phase 1: Critical Fixes** (Immediate)
1. [ ] Create infrastructure repository
2. [ ] Add `/credential-validator` API Gateway endpoint
3. [ ] Add Lambda-to-Lambda invocation permissions
4. [ ] Test end-to-end functionality

### **Phase 2: Complete Setup** (Next)
1. [ ] Add all auth endpoints
2. [ ] Set up proper IAM roles
3. [ ] Add CloudWatch log groups
4. [ ] Configure GitHub Actions

### **Phase 3: Production Ready** (Future)
1. [ ] Add production environment
2. [ ] Add monitoring and alerting
3. [ ] Add security policies
4. [ ] Add documentation

## 🎯 **Success Criteria**
- [ ] `/hello` endpoint works through API Gateway
- [ ] `/credential-validator` endpoint works through API Gateway
- [ ] JWT token forwarding works end-to-end
- [ ] All Lambda functions can invoke each other
- [ ] Infrastructure is completely separated from Lambda code
- [ ] GitHub Actions can deploy infrastructure changes

## 📊 **Current API Gateway Details**
- **API Gateway ID**: `7v2du6tsqk`
- **Current URL**: `https://7v2du6tsqk.execute-api.us-east-1.amazonaws.com/dev`
- **Region**: `us-east-1`
- **Account ID**: `132141655881`

## 🔗 **Dependencies**
- Lambda functions must be deployed first (handled by main project)
- Infrastructure references existing Lambda functions
- GitHub Actions workflows for both projects must be coordinated
