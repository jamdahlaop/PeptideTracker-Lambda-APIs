import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Credential Validator Lambda function called');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { token, credentials, userId, targetFunction } = body;

    // Dummy validation logic for testing
    const isValid = validateCredentials(token, credentials, userId);

    if (!isValid) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
          validation: {
            isValid: false,
            userId: userId || 'unknown',
            tokenPresent: !!token,
            credentialsPresent: !!credentials,
            validationType: 'dummy-validation'
          },
          source: 'Credential Validator - Authentication Failed'
        })
      };
    }

    // If credentials are valid, forward to the target function
    const targetFunctionName = targetFunction || 'peptide-tracker-hello-world-dev';
    console.log(`Forwarding request to: ${targetFunctionName}`);

    try {
      // Create a new event for the target function
      const targetEvent = {
        ...event,
        body: JSON.stringify({
          ...body,
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
          source: 'Credential Validator - Forwarding Error'
        })
      };
    }
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
