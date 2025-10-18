// Test script for session validation endpoint
const https = require('https');

// JWT with session ID in payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"sessionId":"sess_1234567890abcdef"}
const jwtWithSessionId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJzZXNzaW9uSWQiOiJzZXNzXzEyMzQ1Njc4OTBhYmNkZWYifQ.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

const testData = {
  sessionId: 'sess_1234567890abcdef',
  jwtToken: jwtWithSessionId
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'l3349zs8n0.execute-api.us-east-1.amazonaws.com',
  port: 443,
  path: '/dev/session-validation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing Session Validation endpoint...');
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
