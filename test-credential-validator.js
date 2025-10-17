// Simple test script for credential validator endpoint
const https = require('https');

const testData = {
  token: 'test-token-123',
  credentials: {
    username: 'testuser',
    password: 'testpass'
  },
  userId: 'user-123'
};

const postData = JSON.stringify(testData);

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

console.log('Testing Credential Validator endpoint...');
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