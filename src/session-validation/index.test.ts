import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation((command) => {
      // Mock successful session validation for 'test-session'
      const sessionId = command.input?.Key?.sessionId?.S;
      
      if (sessionId === 'test-session') {
        const futureTime = Date.now() + 3600000; // 1 hour in the future
        return Promise.resolve({
          Item: {
            sessionId: { S: 'test-session' },
            userId: { S: 'user-123' },
            isValid: { BOOL: true },
            expiresAt: { N: futureTime.toString() },
            createdAt: { N: Date.now().toString() },
            lastAccessedAt: { N: Date.now().toString() }
          }
        });
      }
      // Return no item for other sessions (session not found)
      return Promise.resolve({ Item: undefined });
    })
  })),
  GetItemCommand: jest.fn().mockImplementation((input) => {
    return {
      input: input
    };
  })
}));

jest.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: jest.fn().mockImplementation((obj) => {
    const marshalled: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') marshalled[key] = { S: obj[key] };
      if (typeof obj[key] === 'number') marshalled[key] = { N: obj[key].toString() };
      if (typeof obj[key] === 'boolean') marshalled[key] = { BOOL: obj[key] };
    }
    return marshalled;
  }),
  unmarshall: jest.fn().mockImplementation((item) => {
    if (!item) return undefined;
    const unmarshalled: any = {};
    for (const key in item) {
      if (item[key].S) unmarshalled[key] = item[key].S;
      if (item[key].N) unmarshalled[key] = parseInt(item[key].N);
      if (item[key].BOOL) unmarshalled[key] = item[key].BOOL;
    }
    // Ensure expiresAt is in the future for test-session
    if (unmarshalled.sessionId === 'test-session') {
      unmarshalled.expiresAt = Date.now() + 3600000; // 1 hour in the future
    }
    return unmarshalled;
  })
}));

// Mock console.log and console.error to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Session Validation Lambda', () => {
  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'POST',
    path: '/session-validation',
    body: JSON.stringify({
      sessionId: 'test-session',
      jwtToken: 'test-jwt-token'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    isBase64Encoded: false
  };

  it('should validate session successfully with valid session ID', async () => {
    const result = await handler(mockEvent);
    
    expect(result.statusCode).toBe(200);
    expect(result.headers).toBeDefined();
    expect(result.headers!['Content-Type']).toBe('application/json');
    expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Session validation successful');
    expect(body.source).toBe('Session Validation - Success');
    expect(body.sessionId).toBe('test-session');
    expect(body.userId).toBe('user-123');
    expect(body.sessionData).toBeDefined();
    expect(body.sessionData.sessionId).toBe('test-session');
    expect(body.sessionData.isValid).toBe(true);
  });

  it('should validate session successfully with JWT token containing session ID', async () => {
    const jwtWithSessionId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJzZXNzaW9uSWQiOiJ0ZXN0LXNlc3Npb24ifQ.test';
    
    const eventWithJWT = {
      ...mockEvent,
      body: JSON.stringify({
        jwtToken: jwtWithSessionId
      })
    };

    const result = await handler(eventWithJWT);
    
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Session validation successful');
    expect(body.sessionId).toBe('test-session');
    expect(body.userId).toBe('user-123');
  });

  it('should return 400 with missing session ID', async () => {
    const eventWithNoSession = {
      ...mockEvent,
      body: JSON.stringify({})
    };

    const result = await handler(eventWithNoSession);

    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Missing session ID');
    expect(body.error).toBe('No session ID provided in request body or JWT payload');
  });

  it('should return 401 for invalid session', async () => {
    const eventWithInvalidSession = {
      ...mockEvent,
      body: JSON.stringify({
        sessionId: 'invalid-session'
      })
    };

    const result = await handler(eventWithInvalidSession);

    expect(result.statusCode).toBe(401);

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Invalid session');
    expect(body.error).toBe('Session not found');
    expect(body.sessionId).toBe('invalid-session');
  });

  it('should handle malformed JSON gracefully', async () => {
    const malformedEvent = {
      ...mockEvent,
      body: 'invalid json'
    };

    const result = await handler(malformedEvent);

    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body);
    expect(body.message).toContain('Internal server error');
  });
});
