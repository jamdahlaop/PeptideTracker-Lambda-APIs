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

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Credential Validator Lambda', () => {
  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'POST',
    path: '/credential-validator',
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
    expect(result.headers!['X-Validated-By']).toBe('credential-validator');
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from mocked target function');
    expect(body.source).toBe('Mocked target function');
  });

  it('should return 401 with missing JWT token/session', async () => {
    const eventWithNoCredentials = {
      ...mockEvent,
      body: JSON.stringify({}),
      headers: {}
    };
    
    const result = await handler(eventWithNoCredentials);
    
    expect(result.statusCode).toBe(401);
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Missing authentication token or session');
    expect(body.error).toBe('No JWT token or session provided');
  });

  it('should return 401 for GET requests without authentication', async () => {
    const getEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      body: null,
      headers: {}
    };
    
    const result = await handler(getEvent);
    
    expect(result.statusCode).toBe(401);
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Missing authentication token or session');
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
