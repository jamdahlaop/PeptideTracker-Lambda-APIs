// Simple local test for the auth service Lambda function
const { handler } = require('./build/index.js');

// Mock AWS SDK
const mockDynamoDB = {
  send: jest.fn()
};

const mockSecretsManager = {
  send: jest.fn()
};

// Mock environment variables
process.env.USERS_TABLE_NAME = 'test-users-table';
process.env.SESSIONS_TABLE_NAME = 'test-sessions-table';
process.env.JWT_SECRET_NAME = 'test-jwt-secret';
process.env.EMAIL_VERIFICATION_SERVICE_URL = 'https://test.com/email-verification';

// Test event for registration
const testEvent = {
  httpMethod: 'POST',
  path: '/auth/register',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
    device_fingerprint: 'test-device-123'
  }),
  headers: {
    'Content-Type': 'application/json'
  },
  requestContext: {
    identity: {
      sourceIp: '127.0.0.1'
    }
  }
};

async function testLocal() {
  console.log('Testing Lambda function locally...');
  console.log('Test event:', JSON.stringify(testEvent, null, 2));
  
  try {
    const result = await handler(testEvent);
    console.log('Success! Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLocal();
