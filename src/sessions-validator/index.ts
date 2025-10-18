import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

// DynamoDB table name for sessions
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || 'peptide-tracker-sessions-dev';

// Interface for session data
interface SessionData {
  sessionId: string;
  userId: string;
  isValid: boolean;
  expiresAt: number;
  createdAt: number;
  lastAccessedAt: number;
}

// Function to validate session against DynamoDB
async function validateSession(sessionId: string): Promise<{ isValid: boolean; sessionData?: SessionData; error?: string }> {
  try {
    console.log(`Validating session: ${sessionId} against table: ${SESSIONS_TABLE}`);
    
    const command = new GetItemCommand({
      TableName: SESSIONS_TABLE,
      Key: marshall({
        sessionId: sessionId
      })
    });

    const response = await dynamoClient.send(command);
    
    if (!response.Item) {
      console.log(`Session not found: ${sessionId}`);
      return { isValid: false, error: 'Session not found' };
    }

    const sessionData = unmarshall(response.Item) as SessionData;
    const currentTime = Date.now();

    // Check if session has expired
    if (sessionData.expiresAt && currentTime > sessionData.expiresAt) {
      console.log(`Session expired: ${sessionId}, expiresAt: ${sessionData.expiresAt}, currentTime: ${currentTime}`);
      return { isValid: false, error: 'Session expired' };
    }

    // Check if session is marked as invalid
    if (!sessionData.isValid) {
      console.log(`Session marked as invalid: ${sessionId}`);
      return { isValid: false, error: 'Session invalid' };
    }

    console.log(`Session valid: ${sessionId}, userId: ${sessionData.userId}`);
    return { isValid: true, sessionData };

  } catch (error) {
    console.error(`Error validating session ${sessionId}:`, error);
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Sessions Validator Lambda function called - npm cache fix test');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { token, session, targetFunction } = body;

    // Extract JWT token from Authorization header or body
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const jwtToken = authHeader?.replace('Bearer ', '') || token;

    // Extract session ID from JWT payload or request body
    let sessionId = session;
    
    // If no session in body, try to extract from JWT payload
    if (!sessionId && jwtToken) {
      try {
        // Decode JWT payload (without verification for now)
        const payload = JSON.parse(Buffer.from(jwtToken.split('.')[1], 'base64').toString());
        sessionId = payload.sessionId || payload.session_id || payload.sid;
        console.log(`Extracted session ID from JWT: ${sessionId}`);
      } catch (error) {
        console.log('Could not extract session ID from JWT:', error);
      }
    }

    // Check if we have a session ID to validate
    if (!sessionId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          message: 'Missing session ID',
          timestamp: new Date().toISOString(),
          error: 'No session ID provided in request body or JWT payload',
          source: 'Sessions Validator - Missing Session'
        })
      };
    }

    // Validate session against DynamoDB
    const sessionValidation = await validateSession(sessionId);
    
    if (!sessionValidation.isValid) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          message: 'Invalid session',
          timestamp: new Date().toISOString(),
          error: sessionValidation.error || 'Session validation failed',
          source: 'Sessions Validator - Invalid Session'
        })
      };
    }

    // If session is valid, forward to the target function
    const targetFunctionName = targetFunction || 'hello-world-lambda';
    console.log(`Forwarding request to: ${targetFunctionName} for user: ${sessionValidation.sessionData?.userId}`);

    try {
      // Create a new event for the target function with validated session data
      const targetEvent = {
        ...event,
        headers: {
          ...event.headers,
          'Authorization': `Bearer ${jwtToken}`,
          'X-Session': sessionId,
          'X-User-Id': sessionValidation.sessionData?.userId || '',
          'X-Validated-By': 'sessions-validator',
          'X-Validation-Timestamp': new Date().toISOString(),
          'X-Session-Expires-At': sessionValidation.sessionData?.expiresAt?.toString() || ''
        },
        body: JSON.stringify({
          ...body,
          jwtToken,
          session: sessionId,
          userId: sessionValidation.sessionData?.userId,
          sessionData: sessionValidation.sessionData,
          validatedBy: 'sessions-validator',
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
                  'X-Validated-By': 'sessions-validator',
                  'X-Validation-Timestamp': new Date().toISOString(),
                  'X-User-Id': sessionValidation.sessionData?.userId || ''
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
