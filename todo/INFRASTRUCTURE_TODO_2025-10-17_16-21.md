# Infrastructure TODO - 2025-10-17_16-21

## 🎯 **Priority: Update Lambda Function Names**

### **Critical Change: Rename credential-validator to sessions-validator**

The Lambda function `credential-validator` has been renamed to `sessions-validator` to better reflect its purpose of validating JWT tokens and sessions.

## 📋 **Infrastructure Updates Required**

### **1. Lambda Function Name Changes**
- [ ] **Update Lambda function name**: `peptide-tracker-credential-validator-dev` → `peptide-tracker-sessions-validator-dev`
- [ ] **Update API Gateway integration** to point to new function name
- [ ] **Update Lambda permissions** for API Gateway to invoke new function
- [ ] **Update CloudWatch log group**: `/aws/lambda/peptide-tracker-credential-validator-dev` → `/aws/lambda/peptide-tracker-sessions-validator-dev`

### **2. API Gateway Configuration**
- [ ] **Update resource path**: `/credential-validator` → `/sessions-validator`
- [ ] **Update method integration** to point to new Lambda function
- [ ] **Update deployment** to reflect new configuration
- [ ] **Test endpoint** to ensure it works with new name

### **3. IAM Permissions**
- [ ] **Update Lambda execution role** permissions for new function name
- [ ] **Update API Gateway invoke permissions** for new function
- [ ] **Update Lambda-to-Lambda permissions** (if needed)

### **4. GitHub Actions Workflows**
- [ ] **Update deployment workflow** to use new function name
- [ ] **Update path filters** in workflow (if needed)
- [ ] **Update function name references** in deployment scripts

## 🔧 **Current Status**

### **Lambda Project Changes (Completed)**
- ✅ Renamed directory: `src/credential-validator/` → `src/sessions-validator/`
- ✅ Updated package.json name and description
- ✅ Updated function code comments and messages
- ✅ Updated test files and descriptions
- ✅ Updated GitHub Actions workflow path filters
- ✅ Updated app configuration files

### **Infrastructure Changes (Pending)**
- ❌ Lambda function name in AWS
- ❌ API Gateway integration
- ❌ CloudWatch log group
- ❌ IAM permissions

## 🚀 **Implementation Steps**

### **Step 1: Update Lambda Function Name**
```bash
# Rename the existing Lambda function
aws lambda update-function-configuration \
  --function-name peptide-tracker-credential-validator-dev \
  --new-name peptide-tracker-sessions-validator-dev \
  --region us-east-1
```

### **Step 2: Update API Gateway Integration**
```bash
# Update the integration URI to point to new function
aws apigateway put-integration \
  --rest-api-id 7v2du6tsqk \
  --resource-id [RESOURCE_ID] \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:132141655881:function:peptide-tracker-sessions-validator-dev/invocations
```

### **Step 3: Update CloudWatch Log Group**
```bash
# Create new log group for sessions-validator
aws logs create-log-group \
  --log-group-name /aws/lambda/peptide-tracker-sessions-validator-dev \
  --region us-east-1
```

### **Step 4: Update API Gateway Resource Path**
```bash
# Update the resource path from /credential-validator to /sessions-validator
aws apigateway update-resource \
  --rest-api-id 7v2du6tsqk \
  --resource-id [RESOURCE_ID] \
  --patch-ops op=replace,path=/pathPart,value=sessions-validator
```

## 📊 **Testing Checklist**

- [ ] **Lambda function** responds correctly with new name
- [ ] **API Gateway endpoint** `/dev/sessions-validator` works
- [ ] **JWT token forwarding** still functions properly
- [ ] **Lambda-to-Lambda invocation** works with new function name
- [ ] **CloudWatch logs** appear in new log group
- [ ] **GitHub Actions deployment** works with new configuration

## 🎯 **Success Criteria**

- ✅ **New endpoint**: `https://7v2du6tsqk.execute-api.us-east-1.amazonaws.com/dev/sessions-validator`
- ✅ **Old endpoint**: `/dev/credential-validator` returns 404 (or redirects)
- ✅ **JWT token forwarding** works end-to-end
- ✅ **All tests pass** with new function name
- ✅ **Deployment pipeline** works with new configuration

## 📝 **Notes**

- The function functionality remains the same - only the name changes
- This is a breaking change for any clients using the old endpoint
- Consider adding a deprecation notice or redirect for the old endpoint
- Update any documentation that references the old function name

## 🔗 **Related Files**

- **Lambda Code**: `src/sessions-validator/`
- **GitHub Actions**: `.github/workflows/deploy-lambdas-path-based.yml`
- **App Config**: `app-config.json`, `src/app-config.ts`
- **Tests**: `test-sessions-validator.js` (renamed from test-credential-validator.js)
