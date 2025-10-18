import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Interface for session validation request
interface SessionValidationRequest {
  sessionId?: string;
  jwtToken?: string;
}

// Interface for session validation response
interface SessionValidationResponse {
  isValid: boolean;
  sessionData?: {
    sessionId: string;
    userId: string;
    isValid: boolean;
    expiresAt: number;
    createdAt: number;
    lastAccessedAt: number;
  };
  error?: string;
  userId?: string;
}

/**
 * Validates a session by calling the session-validation Lambda function
 * @param request - The session validation request containing sessionId or jwtToken
 * @returns Promise<SessionValidationResponse> - The validation result
 */
export async function validateSession(request: SessionValidationRequest): Promise<SessionValidationResponse> {
  try {
    const sessionValidationFunctionName = process.env.SESSION_VALIDATION_FUNCTION_NAME || 'peptide-tracker-session-validation-dev';
    
    // Create the event for the session validation Lambda
    const event = {
      httpMethod: 'POST',
      path: '/session-validation',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {},
      resource: '',
      isBase64Encoded: false
    };

    // Invoke the session validation Lambda
    const invokeCommand = new InvokeCommand({
      FunctionName: sessionValidationFunctionName,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);

    if (!response.Payload) {
      throw new Error('No response from session validation function');
    }

    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    // Check if the Lambda returned an error
    if (result.statusCode !== 200) {
      const errorBody = JSON.parse(result.body);
      return {
        isValid: false,
        error: errorBody.error || 'Session validation failed'
      };
    }

    // Parse the successful response
    const successBody = JSON.parse(result.body);
    return {
      isValid: true,
      sessionData: successBody.sessionData,
      userId: successBody.userId
    };

  } catch (error) {
    console.error('Error calling session validation:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validates a session using session ID
 * @param sessionId - The session ID to validate
 * @returns Promise<SessionValidationResponse> - The validation result
 */
export async function validateSessionById(sessionId: string): Promise<SessionValidationResponse> {
  return validateSession({ sessionId });
}

/**
 * Validates a session using JWT token
 * @param jwtToken - The JWT token containing session information
 * @returns Promise<SessionValidationResponse> - The validation result
 */
export async function validateSessionByJWT(jwtToken: string): Promise<SessionValidationResponse> {
  return validateSession({ jwtToken });
}

/**
 * Middleware function to validate session before processing request
 * @param request - The session validation request
 * @returns Promise<{isValid: boolean, userId?: string, error?: string}>
 */
export async function requireValidSession(request: SessionValidationRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  const validation = await validateSession(request);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error || 'Session validation failed'
    };
  }

  return {
    isValid: true,
    userId: validation.userId
  };
}
