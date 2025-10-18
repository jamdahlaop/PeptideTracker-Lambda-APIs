import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

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

// Interface for validation request
interface ValidationRequest {
  sessionId?: string;
  jwtToken?: string;
}

// Interface for validation response
interface ValidationResponse {
  isValid: boolean;
  sessionData?: SessionData;
  error?: string;
  userId?: string;
}

// Function to validate session against DynamoDB
async function validateSession(sessionId: string): Promise<ValidationResponse> {
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
    return { 
      isValid: true, 
      sessionData,
      userId: sessionData.userId
    };

  } catch (error) {
    console.error(`Error validating session ${sessionId}:`, error);
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to extract session ID from JWT token
function extractSessionIdFromJWT(jwtToken: string): string | null {
  try {
    // Decode JWT payload (without verification for now)
    const payload = JSON.parse(Buffer.from(jwtToken.split('.')[1], 'base64').toString());
    return payload.sessionId || payload.session_id || payload.sid || null;
  } catch (error) {
    console.log('Could not extract session ID from JWT:', error);
    return null;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Session Validation Lambda function called');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, jwtToken }: ValidationRequest = body;

    // Extract session ID from JWT token if not provided directly
    let finalSessionId = sessionId;
    if (!finalSessionId && jwtToken) {
      finalSessionId = extractSessionIdFromJWT(jwtToken) || undefined;
    }

    // Check if we have a session ID to validate
    if (!finalSessionId) {
      return {
        statusCode: 400,
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
          source: 'Session Validation - Missing Session'
        })
      };
    }

    // Validate session against DynamoDB
    const validationResult = await validateSession(finalSessionId);

    if (!validationResult.isValid) {
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
          error: validationResult.error || 'Session validation failed',
          source: 'Session Validation - Invalid Session',
          sessionId: finalSessionId
        })
      };
    }

    // Return successful validation result
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Session validation successful',
        timestamp: new Date().toISOString(),
        source: 'Session Validation - Success',
        sessionId: finalSessionId,
        userId: validationResult.userId,
        sessionData: {
          sessionId: validationResult.sessionData?.sessionId,
          userId: validationResult.sessionData?.userId,
          isValid: validationResult.sessionData?.isValid,
          expiresAt: validationResult.sessionData?.expiresAt,
          createdAt: validationResult.sessionData?.createdAt,
          lastAccessedAt: validationResult.sessionData?.lastAccessedAt
        }
      })
    };

  } catch (error) {
    console.error('Error in session validation:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Internal server error in session validation',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'Session Validation - Internal Error'
      })
    };
  }
};
