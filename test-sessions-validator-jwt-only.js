// Test script for sessions-validator with JWT-only (no session in body)
const https = require('https');

// JWT with session ID in payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"sessionId":"sess_1234567890abcdef"}
const jwtWithSessionId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJzZXNzaW9uSWQiOiJzZXNzXzEyMzQ1Njc4OTBhYmNkZWYifQ.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

const testData = {
  token: jwtWithSessionId,
  // No session in body - should be extracted from JWT
  targetFunction: 'hello-world-lambda',
  userId: 'user-123'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'l3349zs8n0.execute-api.us-east-1.amazonaws.com',
  port: 443,
  path: '/dev/sessions-validator',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing Sessions Validator with JWT-only (session extracted from JWT)...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Payload:', JSON.stringify(testData, null, 2));

const req = https.request(options, (res) => {
  console.log(`\nResponse Status: ${res.statusCode}`);
  console.log('Response Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
