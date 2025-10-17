import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

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
      token: 'test-token',
      credentials: { username: 'testuser' },
      userId: 'user-123'
    }),
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    isBase64Encoded: false
  };

  it('should return 200 with valid credentials', async () => {
    const result = await handler(mockEvent);
    
    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Credential validation completed');
    expect(body.validation.isValid).toBe(true);
    expect(body.validation.userId).toBe('user-123');
    expect(body.validation.tokenPresent).toBe(true);
  });

  it('should return 200 with invalid/missing credentials', async () => {
    const eventWithNoCredentials = {
      ...mockEvent,
      body: JSON.stringify({})
    };
    
    const result = await handler(eventWithNoCredentials);
    
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.validation.isValid).toBe(false);
    expect(body.validation.tokenPresent).toBe(false);
    expect(body.validation.credentialsPresent).toBe(false);
  });

  it('should handle GET requests', async () => {
    const getEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      body: null
    };
    
    const result = await handler(getEvent);
    
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.method).toBe('GET');
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
