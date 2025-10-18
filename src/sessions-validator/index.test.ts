import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Payload: JSON.stringify({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Hello from mocked target function',
          timestamp: new Date().toISOString(),
          method: 'POST',
          path: '/hello',
          source: 'Mocked target function'
        })
      })
    })
  })),
  InvokeCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation((command) => {
      // Mock successful session validation for 'test-session'
      const sessionId = command.input?.Key?.sessionId?.S || 'test-session';
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
  GetItemCommand: jest.fn()
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

describe('Sessions Validator Lambda', () => {
  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'POST',
    path: '/sessions-validator',
    body: JSON.stringify({
      jwtToken: 'test-jwt-token',
      session: 'test-session',
      userId: 'user-123'
    }),
    headers: {
      'Authorization': 'Bearer test-jwt-token'
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

  it('should forward request to target function with valid JWT token', async () => {
    const result = await handler(mockEvent);
    
    expect(result.statusCode).toBe(200);
    expect(result.headers).toBeDefined();
    expect(result.headers!['Content-Type']).toBe('application/json');
    expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers!['X-Validated-By']).toBe('sessions-validator');
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from mocked target function');
    expect(body.source).toBe('Mocked target function');
  });

  it('should return 401 with missing session ID', async () => {
    const eventWithNoSession = {
      ...mockEvent,
      body: JSON.stringify({}),
      headers: {}
    };

    const result = await handler(eventWithNoSession);

    expect(result.statusCode).toBe(401);

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Missing session ID');
    expect(body.error).toBe('No session ID provided in request body or JWT payload');
  });

  it('should return 401 for GET requests without session', async () => {
    const getEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      body: null,
      headers: {}
    };

    const result = await handler(getEvent);

    expect(result.statusCode).toBe(401);

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Missing session ID');
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
