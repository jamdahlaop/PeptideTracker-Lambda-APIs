import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Hello World Lambda function called');
  console.log('Event:', JSON.stringify(event, null, 2));

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify({
      message: 'Hello from Lambda via Git deployment! - Test change at ' + new Date().toISOString(),
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters,
      source: 'Git-based deployment'
    })
  };

  return response;
};
// Trigger deployment - 10/17/2025 08:09:22
// OIDC deployment test - 10/17/2025 09:35:07
