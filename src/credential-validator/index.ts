import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Credential Validator Lambda function called');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { token, credentials, userId } = body;

    // Dummy validation logic for testing
    const isValid = validateCredentials(token, credentials, userId);

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Credential validation completed',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        validation: {
          isValid,
          userId: userId || 'unknown',
          tokenPresent: !!token,
          credentialsPresent: !!credentials,
          validationType: 'dummy-validation'
        },
        source: 'Git-based deployment - Credential Validator'
      })
    };

    return response;
  } catch (error) {
    console.error('Error in credential validator:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Internal server error in credential validation',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Dummy validation function for testing
function validateCredentials(token?: string, credentials?: any, userId?: string): boolean {
  // For testing purposes, always return true if we have some data
  if (token || credentials || userId) {
    return true;
  }
  
  // If no data provided, return false
  return false;
}
