import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Template Lambda Function
 * 
 * This is a template for creating new Lambda functions in the Peptide Tracker project.
 * 
 * To create a new Lambda function:
 * 1. Copy this template directory
 * 2. Rename it to your function name (e.g., 'user-profile', 'data-analysis')
 * 3. Update the package.json name and description
 * 4. Implement your business logic in the handler function
 * 5. Add any required environment variables to the GitHub Actions workflow
 * 6. Update the API Gateway configuration in infrastructure/
 * 
 * Environment Variables Available:
 * - USERS_TABLE_NAME: DynamoDB table for user data
 * - SESSIONS_TABLE_NAME: DynamoDB table for session data
 * - JWT_SECRET_NAME: AWS Secrets Manager secret name for JWT
 */

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // TODO: Implement your business logic here
    const response = {
      message: 'Hello from Lambda Template!',
      timestamp: new Date().toISOString(),
      source: 'Git-based deployment',
      functionName: 'lambda-template',
      method: event.httpMethod,
      path: event.path,
      // Add your response data here
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
