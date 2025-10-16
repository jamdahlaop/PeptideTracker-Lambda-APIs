#!/usr/bin/env node

/**
 * Local testing script for Lambda functions
 * This script helps test Lambda functions locally before deployment
 */

const path = require('path');
const fs = require('fs');

// Test event for API Gateway
const testEvent = {
  httpMethod: 'GET',
  path: '/',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'test-agent'
  },
  queryStringParameters: {
    test: 'true'
  },
  requestContext: {
    identity: {
      sourceIp: '127.0.0.1'
    }
  },
  body: null
};

async function testHelloWorld() {
  console.log('🧪 Testing Hello World Lambda...');
  
  try {
    const { handler } = require('../src/hello-world/build/index.js');
    const result = await handler(testEvent);
    
    console.log('✅ Hello World Lambda test successful!');
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Hello World Lambda test failed:', error.message);
  }
}

async function testAuthService() {
  console.log('🧪 Testing Auth Service Lambda...');
  
  try {
    const { handler } = require('../src/auth_service/build/index.js');
    
    // Test registration endpoint
    const registerEvent = {
      ...testEvent,
      httpMethod: 'POST',
      path: '/auth/register',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
    };
    
    const result = await handler(registerEvent);
    
    console.log('✅ Auth Service Lambda test successful!');
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Auth Service Lambda test failed:', error.message);
    console.log('Note: This is expected if AWS services are not configured locally');
  }
}

async function main() {
  console.log('🚀 Starting local Lambda function tests...\n');
  
  // Check if build files exist
  const helloWorldBuild = path.join(__dirname, '../src/hello-world/build/index.js');
  const authServiceBuild = path.join(__dirname, '../src/auth_service/build/index.js');
  
  if (!fs.existsSync(helloWorldBuild)) {
    console.log('⚠️  Hello World build not found. Run "npm run build" in src/hello-world/');
    return;
  }
  
  if (!fs.existsSync(authServiceBuild)) {
    console.log('⚠️  Auth Service build not found. Run "npm run build" in src/auth_service/');
    return;
  }
  
  await testHelloWorld();
  console.log('');
  await testAuthService();
  
  console.log('\n🎉 Local testing completed!');
  console.log('\nNext steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Configure AWS secrets in GitHub repository settings');
  console.log('3. The GitHub Actions workflow will automatically deploy to AWS Lambda');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testHelloWorld, testAuthService };
