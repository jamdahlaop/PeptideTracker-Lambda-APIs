import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Hello World Lambda function called');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Extract JWT token and session from headers or body
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const jwtToken = authHeader?.replace('Bearer ', '');
  const session = event.headers['X-Session'] || '';
  const validatedBy = event.headers['X-Validated-By'] || 'direct-call';

  // Parse body if it exists
  let requestBody = {};
  try {
    requestBody = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    console.log('Could not parse request body:', error);
  }

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify({
      message: 'Hello from Lambda via Path-Based Deployment! - Test change at ' + new Date().toISOString(),
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters,
      source: 'Git-based deployment',
      authentication: {
        hasJwtToken: !!jwtToken,
        hasSession: !!session,
        validatedBy: validatedBy,
        tokenLength: jwtToken ? jwtToken.length : 0
      },
      requestData: {
        body: requestBody,
        headers: {
          authorization: !!authHeader,
          session: !!session,
          validatedBy: validatedBy
        }
      }
    })
  };

  return response;
};
// Trigger deployment - 10/17/2025 08:09:22
// OIDC deployment test - 10/17/2025 09:35:07
