# Peptide Tracker Infrastructure

This directory contains Terraform configuration for the AWS infrastructure required by the Peptide Tracker Lambda functions.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform installed** (version >= 1.0)
3. **AWS Account** with necessary permissions

## Quick Start

1. **Copy the example variables file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Customize the variables** in `terraform.tfvars`:
   ```hcl
   aws_region     = "us-east-1"
   environment    = "dev"
   project_name   = "peptide-tracker"
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Plan the deployment**:
   ```bash
   terraform plan
   ```

5. **Apply the infrastructure**:
   ```bash
   terraform apply
   ```

6. **Get the outputs** (including GitHub secrets):
   ```bash
   terraform output
   ```

## What Gets Created

### DynamoDB Tables
- **peptide-tracker-users**: User data storage with email index
- **peptide-tracker-sessions**: Session management with TTL

### AWS Secrets Manager
- **peptide-tracker/jwt-secret**: JWT signing secret (auto-generated)

### IAM Resources
- **Lambda execution role** with necessary permissions
- **Policies** for DynamoDB and Secrets Manager access

### API Gateway
- **REST API** with endpoints for Lambda functions
- **CORS configuration** for web applications

## GitHub Secrets

After running `terraform apply`, you'll get output values that should be added as GitHub secrets:

```bash
terraform output github_secrets
```

Add these to your GitHub repository secrets:
- `AWS_LAMBDA_ROLE_ARN`
- `AWS_REGION`
- `USERS_TABLE_NAME`
- `SESSIONS_TABLE_NAME`
- `JWT_SECRET_NAME`

## Environment Management

### Development
```bash
terraform workspace new dev
terraform apply -var="environment=dev"
```

### Production
```bash
terraform workspace new prod
terraform apply -var="environment=prod"
```

## Cost Optimization

- **DynamoDB**: Uses on-demand billing (pay per request)
- **Lambda**: Only pay when functions are invoked
- **API Gateway**: Pay per API call
- **Secrets Manager**: $0.40/month per secret

## Security Features

- **Least privilege IAM policies**
- **Encrypted secrets** in AWS Secrets Manager
- **VPC endpoints** (can be added for enhanced security)
- **CloudTrail logging** (recommended for production)

## Monitoring

Consider adding these for production:
- **CloudWatch alarms** for Lambda errors
- **X-Ray tracing** for request tracing
- **CloudTrail** for API auditing

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will delete all data in DynamoDB tables and secrets!
