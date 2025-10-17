# Lambda Function Management Guide

This guide explains how to create, deploy, and manage Lambda functions in the Peptide Tracker project using our Git-based CI/CD system.

## 🚀 Quick Start

### Creating a New Lambda Function

1. **Create the function from template:**
   ```powershell
   .\scripts\create-lambda-function.ps1 -FunctionName "user-profile" -Description "User profile management" -HttpMethod "GET" -ApiPath "/users/profile"
   ```

2. **Add to infrastructure:**
   ```powershell
   .\scripts\add-lambda-to-infrastructure.ps1 -FunctionName "user-profile" -HttpMethod "GET" -ApiPath "/users/profile"
   ```

3. **Deploy infrastructure:**
   ```powershell
   cd infrastructure
   terraform plan
   terraform apply
   ```

4. **Implement your logic:**
   - Edit `src/user-profile/src/index.ts`
   - Add any required dependencies to `package.json`

5. **Deploy via Git:**
   ```powershell
   git add .
   git commit -m "Add user-profile Lambda function"
   git push
   ```

## 📁 Project Structure

```
src/
├── lambda-template/          # Template for new functions
│   ├── package.json
│   ├── tsconfig.json
│   └── src/index.ts
├── hello-world/              # Example function
│   ├── package.json
│   ├── tsconfig.json
│   └── src/index.ts
└── [your-function]/          # Your new functions
    ├── package.json
    ├── tsconfig.json
    └── src/index.ts
```

## 🔧 Available Scripts

### `create-lambda-function.ps1`
Creates a new Lambda function from the template.

**Parameters:**
- `-FunctionName` (required): Name of the function (lowercase, hyphens allowed)
- `-Description` (optional): Description of the function
- `-HttpMethod` (optional): HTTP method (default: GET)
- `-ApiPath` (optional): API path (default: /{function-name})

**Example:**
```powershell
.\scripts\create-lambda-function.ps1 -FunctionName "data-analysis" -Description "Data analysis service" -HttpMethod "POST" -ApiPath "/api/analyze"
```

### `add-lambda-to-infrastructure.ps1`
Adds a Lambda function to the Terraform infrastructure.

**Parameters:**
- `-FunctionName` (required): Name of the function
- `-HttpMethod` (required): HTTP method (GET, POST, PUT, DELETE, PATCH)
- `-ApiPath` (required): API path (must start with /)
- `-Description` (optional): Description of the function

**Example:**
```powershell
.\scripts\add-lambda-to-infrastructure.ps1 -FunctionName "data-analysis" -HttpMethod "POST" -ApiPath "/api/analyze"
```

## 🏗️ Infrastructure Management

### Adding Functions to Infrastructure

The infrastructure is managed in `infrastructure/lambda-api-gateway.tf`. Functions are defined in the `local.lambda_functions` block:

```hcl
locals {
  lambda_functions = {
    "hello-world" = {
      http_method = "GET"
      api_path    = "/hello"
      description = "Hello World Lambda function"
    }
    "user-profile" = {
      http_method = "GET"
      api_path    = "/users/profile"
      description = "User profile management"
    }
    # Add more functions here...
  }
}
```

### Automatic Resources Created

For each function in the `lambda_functions` map, Terraform automatically creates:

1. **Lambda Function** - The actual function with Node.js 22 runtime
2. **API Gateway Resource** - The API endpoint path
3. **API Gateway Method** - The HTTP method (GET, POST, etc.)
4. **API Gateway Integration** - Connection between API Gateway and Lambda
5. **Lambda Permission** - Allows API Gateway to invoke the function

## 🔄 CI/CD Workflow

### Dynamic Function Discovery

The GitHub Actions workflow automatically discovers all Lambda functions by:
1. Scanning `src/` directory for `package.json` files
2. Excluding the `lambda-template` directory
3. Building and deploying each discovered function

### Workflow Steps

1. **Discover Functions** - Finds all Lambda functions in the project
2. **Test** - Builds and tests each function
3. **Deploy** - Deploys each function to AWS Lambda

### Environment Variables

All Lambda functions automatically receive these environment variables:
- `USERS_TABLE_NAME` - DynamoDB users table
- `SESSIONS_TABLE_NAME` - DynamoDB sessions table  
- `JWT_SECRET_NAME` - AWS Secrets Manager JWT secret

## 📝 Function Template

Each new function starts with this template structure:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Your business logic here
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // ... other CORS headers
      },
      body: JSON.stringify({
        message: 'Success',
        // ... your response data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
```

## 🧪 Testing

### Local Testing

1. **Install dependencies:**
   ```powershell
   cd src/your-function
   npm install
   ```

2. **Build:**
   ```powershell
   npm run build
   ```

3. **Test locally:**
   ```powershell
   # Create a test event file
   echo '{"httpMethod": "GET", "path": "/test"}' > test-event.json
   
   # Test with AWS SAM or similar tool
   ```

### Integration Testing

After deployment, test your API endpoint:
```bash
curl -X GET https://your-api-gateway-url/dev/your-endpoint
```

## 🔒 Security

### IAM Permissions

The GitHub Actions role automatically gets permissions for:
- `lambda:CreateFunction`
- `lambda:UpdateFunctionCode`
- `lambda:UpdateFunctionConfiguration`
- `lambda:GetFunction`
- `lambda:ListFunctions`

### Environment Variables

Sensitive data is managed through:
- **AWS Secrets Manager** - For JWT secrets and other sensitive config
- **DynamoDB** - For user and session data
- **Environment Variables** - For table names and secret names

## 📊 Monitoring

### CloudWatch Logs

Each Lambda function automatically creates CloudWatch log groups:
- `/aws/lambda/{function-name}-lambda`

### API Gateway Logs

API Gateway logs are available in CloudWatch:
- API Gateway execution logs
- Access logs (if enabled)

## 🚨 Troubleshooting

### Common Issues

1. **Function not found in deployment:**
   - Check that `package.json` exists in the function directory
   - Ensure the function is not in the `lambda-template` directory

2. **API Gateway 502 errors:**
   - Check Lambda function logs in CloudWatch
   - Verify the function is deployed and has the correct handler

3. **Permission denied errors:**
   - Check IAM role permissions
   - Verify the function name matches the IAM policy

4. **Build failures:**
   - Check TypeScript compilation errors
   - Verify all dependencies are in `package.json`

### Debugging Steps

1. **Check GitHub Actions logs:**
   - Go to your repository's Actions tab
   - Click on the failed workflow run
   - Review the build and deployment logs

2. **Check AWS CloudWatch:**
   - Look for Lambda function logs
   - Check API Gateway execution logs

3. **Verify infrastructure:**
   ```powershell
   cd infrastructure
   terraform plan
   terraform show
   ```

## 🎯 Best Practices

1. **Function Naming:**
   - Use lowercase with hyphens (e.g., `user-profile`, `data-analysis`)
   - Keep names descriptive but concise

2. **API Design:**
   - Use RESTful conventions
   - Include versioning in paths (e.g., `/api/v1/users`)
   - Use appropriate HTTP methods

3. **Error Handling:**
   - Always return proper HTTP status codes
   - Include meaningful error messages
   - Log errors for debugging

4. **Performance:**
   - Keep functions focused and lightweight
   - Use connection pooling for databases
   - Implement proper caching strategies

5. **Security:**
   - Validate all inputs
   - Use environment variables for configuration
   - Implement proper authentication/authorization

## 📚 Additional Resources

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
