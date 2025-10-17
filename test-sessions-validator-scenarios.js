// Test different scenarios for credential validator
const https = require('https');

function makeRequest(payload, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: '7v2du6tsqk.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: '/dev/credential-validator',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n=== ${description} ===`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          console.log('Response:', JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log(`Status: ${res.statusCode}`);
          console.log('Response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Error: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Valid token
    await makeRequest(
      { token: 'valid-token-123', userId: 'user-123' },
      'Test 1: Valid Token'
    );

    // Test 2: Valid credentials
    await makeRequest(
      { 
        credentials: { username: 'testuser', password: 'testpass' },
        userId: 'user-456'
      },
      'Test 2: Valid Credentials'
    );

    // Test 3: Both token and credentials
    await makeRequest(
      { 
        token: 'token-789',
        credentials: { username: 'admin', password: 'admin123' },
        userId: 'user-789'
      },
      'Test 3: Both Token and Credentials'
    );

    // Test 4: No credentials (should be invalid)
    await makeRequest(
      { userId: 'user-999' },
      'Test 4: No Credentials (Invalid)'
    );

    // Test 5: Empty payload
    await makeRequest(
      {},
      'Test 5: Empty Payload (Invalid)'
    );

    // Test 6: Malformed credentials
    await makeRequest(
      { 
        credentials: { username: 'testuser' }, // missing password
        userId: 'user-invalid'
      },
      'Test 6: Incomplete Credentials (Invalid)'
    );

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
