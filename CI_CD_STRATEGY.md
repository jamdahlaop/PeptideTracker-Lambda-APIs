# CI/CD Strategy for Multiple Lambda Functions

## 🎯 **Current Problem**
- Every push triggers deployment of ALL Lambda functions
- Inefficient as the number of Lambda functions grows
- Wastes resources and time
- Makes it hard to track which function changed

## 🚀 **Recommended Solution: Feature Branch + Merge Strategy**

### **Option 1: Path-Based Deployment (Recommended)**
Only deploy Lambda functions that have changes in their specific directories.

### **Option 2: Feature Branch Strategy**
Deploy on feature branch merges with selective function deployment.

## 📋 **Implementation Options**

### **Option 1: Path-Based Deployment**

#### **GitHub Actions Workflow Structure:**
```yaml
name: Deploy Changed Lambda Functions

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      hello-world: ${{ steps.changes.outputs.hello-world }}
      credential-validator: ${{ steps.changes.outputs.credential-validator }}
      auth-service: ${{ steps.changes.outputs.auth-service }}
      # Add more as needed
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            hello-world:
              - 'src/hello-world/**'
            credential-validator:
              - 'src/credential-validator/**'
            auth-service:
              - 'src/auth_service/**'
            # Add more as needed

  deploy-hello-world:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.hello-world == 'true' }}
    runs-on: ubuntu-latest
    # ... existing deployment steps

  deploy-credential-validator:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.credential-validator == 'true' }}
    runs-on: ubuntu-latest
    # ... existing deployment steps

  deploy-auth-service:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.auth-service == 'true' }}
    runs-on: ubuntu-latest
    # ... existing deployment steps
```

### **Option 2: Feature Branch Strategy**

#### **Workflow Structure:**
```yaml
name: Deploy Lambda Functions

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    types: [closed]

jobs:
  deploy-on-merge:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v35
        with:
          files: |
            src/hello-world/**
            src/credential-validator/**
            src/auth_service/**
      
      - name: Deploy changed functions
        run: |
          if [[ "${{ steps.changed-files.outputs.any_changed }}" == "true" ]]; then
            # Deploy only changed functions
            echo "Deploying changed Lambda functions..."
          fi
```

## 🎯 **Recommended Approach: Path-Based Deployment**

### **Benefits:**
- ✅ **Efficient**: Only deploys changed functions
- ✅ **Fast**: Reduces deployment time
- ✅ **Scalable**: Works with any number of Lambda functions
- ✅ **Clear**: Easy to see which functions are being deployed
- ✅ **Safe**: Reduces risk of unintended deployments

### **Implementation Steps:**

1. **Create a single workflow file** that detects changes
2. **Use path filters** to determine which functions changed
3. **Conditionally run deployment jobs** based on changes
4. **Keep individual deployment logic** in separate jobs

## 📁 **File Structure:**
```
.github/workflows/
├── deploy-lambdas.yml          # Main deployment workflow
├── deploy-hello-world.yml      # Individual function workflow (optional)
├── deploy-credential-validator.yml
└── deploy-auth-service.yml
```

## 🔧 **Implementation Example:**

### **Main Workflow File:**
```yaml
name: Deploy Lambda Functions

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      hello-world: ${{ steps.changes.outputs.hello-world }}
      credential-validator: ${{ steps.changes.outputs.credential-validator }}
      auth-service: ${{ steps.changes.outputs.auth-service }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            hello-world:
              - 'src/hello-world/**'
            credential-validator:
              - 'src/credential-validator/**'
            auth-service:
              - 'src/auth_service/**'

  deploy-hello-world:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.hello-world == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd src/hello-world
          npm ci
      
      - name: Build
        run: |
          cd src/hello-world
          npm run build
      
      - name: Deploy to Lambda
        run: |
          cd src/hello-world
          # ... deployment steps

  deploy-credential-validator:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.credential-validator == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd src/credential-validator
          npm ci
      
      - name: Build
        run: |
          cd src/credential-validator
          npm run build
      
      - name: Deploy to Lambda
        run: |
          cd src/credential-validator
          # ... deployment steps
```

## 🚀 **Migration Strategy:**

### **Phase 1: Immediate (This Week)**
1. Create new path-based deployment workflow
2. Test with current functions
3. Gradually migrate existing workflows

### **Phase 2: Optimization (Next Week)**
1. Add more Lambda functions
2. Optimize deployment times
3. Add deployment notifications

### **Phase 3: Advanced (Future)**
1. Add rollback capabilities
2. Add deployment approvals for production
3. Add monitoring and alerting

## 📊 **Expected Benefits:**

| Metric | Before | After |
|--------|--------|-------|
| **Deployment Time** | ~5-10 min | ~1-3 min |
| **Resource Usage** | High | Low |
| **Deployment Frequency** | Every push | Only changed functions |
| **Scalability** | Poor | Excellent |

## 🎯 **Next Steps:**

1. **Implement path-based deployment** for current functions
2. **Test with feature branches** to ensure it works
3. **Add new Lambda functions** using the same pattern
4. **Monitor deployment times** and optimize as needed

This approach will scale beautifully as you add more Lambda functions! 🚀
