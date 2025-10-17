// Test JWT token forwarding through credential-validator to hello-world
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
    // Test 1: JWT token in Authorization header
    await makeRequest(
      { 
        targetFunction: 'peptide-tracker-hello-world-dev',
        userId: 'user-123'
      },
      { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
      'Test 1: JWT Token in Authorization Header'
    );

    // Test 2: JWT token in request body
    await makeRequest(
      { 
        jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        session: 'session-abc-123',
        targetFunction: 'peptide-tracker-hello-world-dev',
        userId: 'user-456'
      },
      {},
      'Test 2: JWT Token in Request Body'
    );

    // Test 3: Session only
    await makeRequest(
      { 
        session: 'session-xyz-789',
        targetFunction: 'peptide-tracker-hello-world-dev',
        userId: 'user-789'
      },
      {},
      'Test 3: Session Only'
    );

    // Test 4: No authentication (should fail)
    await makeRequest(
      { 
        targetFunction: 'peptide-tracker-hello-world-dev',
        userId: 'user-999'
      },
      {},
      'Test 4: No Authentication (Should Fail)'
    );

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
