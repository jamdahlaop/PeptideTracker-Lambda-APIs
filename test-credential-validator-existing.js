// Test credential-validator with existing Lambda functions
const https = require('https');

function makeRequest(payload, headers = {}, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: '7v2du6tsqk.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: '/dev/credential-validator',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    console.log(`\n=== ${description} ===`);
    console.log('Headers:', JSON.stringify(headers, null, 2));
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
    // Test 1: JWT token with existing test-lambda function
    await makeRequest(
      { 
        targetFunction: 'peptide-tracker-test-lambda-dev',
        userId: 'user-123'
      },
      { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
      'Test 1: JWT Token with test-lambda function'
    );

    // Test 2: JWT token with data-manager-api function
    await makeRequest(
      { 
        targetFunction: 'peptide-tracker-data-manager-api-dev',
        userId: 'user-456'
      },
      { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
      'Test 2: JWT Token with data-manager-api function'
    );

    // Test 3: No authentication (should fail)
    await makeRequest(
      { 
        targetFunction: 'peptide-tracker-test-lambda-dev',
        userId: 'user-999'
      },
      {},
      'Test 3: No Authentication (Should Fail)'
    );

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
