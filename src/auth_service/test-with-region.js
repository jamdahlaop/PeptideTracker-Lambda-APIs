// Local test with AWS region configured
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_DEFAULT_REGION = 'us-east-1';

const { handler } = require('./build/index.js');

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
  console.log('Testing Lambda function locally with AWS region configured...');
  console.log('AWS Region:', process.env.AWS_REGION);
  
  try {
    const result = await handler(testEvent);
    console.log('Result status code:', result.statusCode);
    console.log('Result body:', result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ SUCCESS: Registration worked!');
    } else {
      console.log('❌ FAILED: Registration failed with status', result.statusCode);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLocal();
