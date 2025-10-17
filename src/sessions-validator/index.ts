import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Sessions Validator Lambda function called - npm cache fix test');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { token, session, targetFunction } = body;

    // Extract JWT token from Authorization header or body
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const jwtToken = authHeader?.replace('Bearer ', '') || token;

    // Basic validation - check if we have a token/session
    const hasValidToken = !!jwtToken || !!session;

    if (!hasValidToken) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          message: 'Missing authentication token or session',
          timestamp: new Date().toISOString(),
          error: 'No JWT token or session provided',
          source: 'Sessions Validator - Missing Auth'
        })
      };
    }

    // If credentials are valid, forward to the target function
    const targetFunctionName = targetFunction || 'peptide-tracker-hello-world-dev';
    console.log(`Forwarding request to: ${targetFunctionName}`);

    try {
      // Create a new event for the target function with JWT token and session
      const targetEvent = {
        ...event,
        headers: {
          ...event.headers,
          'Authorization': `Bearer ${jwtToken}`,
          'X-Session': session || '',
          'X-Validated-By': 'credential-validator',
          'X-Validation-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          ...body,
          jwtToken,
          session,
          validatedBy: 'credential-validator',
          validationTimestamp: new Date().toISOString()
        })
      };

      // Invoke the target Lambda function
      const invokeCommand = new InvokeCommand({
        FunctionName: targetFunctionName,
        Payload: JSON.stringify(targetEvent)
      });

      const response = await lambdaClient.send(invokeCommand);
      
      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        console.log('Target function response:', result);
        
        // Return the response from the target function
        return {
          statusCode: result.statusCode || 200,
          headers: {
            ...result.headers,
            'X-Validated-By': 'credential-validator',
            'X-Validation-Timestamp': new Date().toISOString()
          },
          body: result.body
        };
      } else {
        throw new Error('No response from target function');
      }
    } catch (invokeError) {
      console.error('Error invoking target function:', invokeError);
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          message: 'Error forwarding request to target function',
          timestamp: new Date().toISOString(),
          error: invokeError instanceof Error ? invokeError.message : 'Unknown error',
          source: 'Sessions Validator - Forwarding Error'
        })
      };
    }
  } catch (error) {
    console.error('Error in sessions validator:', error);
    
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
