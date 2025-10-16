import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

// Generate UUID function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize AWS clients
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const secretsClient = new SecretsManagerClient({});

// Get JWT secret from AWS Secrets Manager
async function getJwtSecret(): Promise<string> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: 'peptide-tracker/jwt-secret'
    });
    const response = await secretsClient.send(command);
    return response.SecretString || '';
  } catch (error) {
    console.error('Error getting JWT secret:', error);
    throw new Error('JWT secret not found');
  }
}

// Generate JWT token
async function generateToken(user: any, sessionId: string, tokenVersion: number, expiresIn: string = '24h'): Promise<string> {
  const secret = await getJwtSecret();
  return jwt.sign({
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    status: user.status,
    session_id: sessionId,
    token_version: tokenVersion
  }, secret, { expiresIn });
}

// Generate refresh token
function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash token for storage
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Create user session
async function createSession(user: any, ipAddress?: string, userAgent?: string, deviceFingerprint?: string) {
  const sessionsTable = process.env.SESSIONS_TABLE_NAME;
  if (!sessionsTable) {
    throw new Error('SESSIONS_TABLE_NAME environment variable not set');
  }

  const sessionId = generateUUID();
  const tokenVersion = 1;
  const now = new Date();
  const accessExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const accessToken = await generateToken(user, sessionId, tokenVersion, '24h');
  const refreshToken = generateRefreshToken();

  const session = {
    session_id: sessionId,
    user_id: user.user_id,
    token_hash: hashToken(accessToken),
    refresh_token_hash: hashToken(refreshToken),
    created_at: now.toISOString(),
    last_activity: now.toISOString(),
    expires_at: accessExpiresAt.toISOString(),
    refresh_expires_at: refreshExpiresAt.toISOString(),
    is_active: true,
    ip_address: ipAddress || undefined,
    user_agent: userAgent || undefined,
    device_fingerprint: deviceFingerprint || undefined,
    token_version: tokenVersion
  };

  await dynamodb.send(new PutCommand({
    TableName: sessionsTable,
    Item: session
  }));

  return { accessToken, refreshToken, session };
}

// Verify JWT token
async function verifyToken(token: string): Promise<any> {
  const secret = await getJwtSecret();
  return jwt.verify(token, secret);
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Format API response
function formatResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

// Get user from token
async function getUserFromToken(event: APIGatewayProxyEvent): Promise<any> {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    const command = new GetCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { user_id: decoded.user_id }
    });
    
    const response = await dynamodb.send(command);
    return response.Item || null;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Handle user registration
async function handleRegistration(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, password, organization, department } = body;

    if (!name || !email || !password) {
      return formatResponse(400, { error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return formatResponse(400, { error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUserCommand = new QueryCommand({
      TableName: process.env.USERS_TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    });

    const existingUser = await dynamodb.send(existingUserCommand);
    if (existingUser.Items && existingUser.Items.length > 0) {
      return formatResponse(409, { error: 'User with this email already exists' });
    }

    // Create new user
    const userId = generateUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const user = {
      user_id: userId,
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      role: 'user',
      status: 'pending_verification',
      created_at: now,
      updated_at: now,
      email_verified: false,
      two_factor_enabled: false,
      ...(organization || department ? {
        profile: {
          ...(organization && { organization }),
          ...(department && { department })
        }
      } : {})
    };

    const putCommand = new PutCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Item: user
    });

    await dynamodb.send(putCommand);

    // Send verification email (placeholder)
    try {
      await sendVerificationEmail(user.user_id);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    // Create session and return token
    const sessionId = generateUUID();
    const token = await generateToken(user, sessionId, 1, '24h');
    const { password_hash, ...userWithoutPassword } = user;

    return formatResponse(201, {
      token,
      user: userWithoutPassword,
      expires_in: 86400,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return formatResponse(500, { error: 'Internal server error' });
  }
}

// Handle user login
async function handleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, remember_me, device_fingerprint } = body;

    if (!email || !password) {
      return formatResponse(400, { error: 'Email and password are required' });
    }

    const queryCommand = new QueryCommand({
      TableName: process.env.USERS_TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() }
    });

    const response = await dynamodb.send(queryCommand);
    if (!response.Items || response.Items.length === 0) {
      return formatResponse(401, { error: 'Invalid email or password' });
    }

    const user = response.Items[0];
    if (user.status !== 'active') {
      return formatResponse(401, { error: 'Account is not active. Please verify your email or contact support.' });
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return formatResponse(401, { error: 'Invalid email or password' });
    }

    // Update last login
    const updateCommand = new UpdateCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { user_id: user.user_id },
      UpdateExpression: 'SET last_login = :last_login, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':last_login': new Date().toISOString(),
        ':updated_at': new Date().toISOString()
      }
    });

    await dynamodb.send(updateCommand);

    // Create session
    const ipAddress = event.requestContext?.identity?.sourceIp;
    const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
    const { accessToken, refreshToken, session } = await createSession(user, ipAddress, userAgent, device_fingerprint);

    const { password_hash, ...userWithoutPassword } = user;

    return formatResponse(200, {
      token: accessToken,
      refresh_token: refreshToken,
      user: userWithoutPassword,
      session_id: session.session_id,
      expires_in: remember_me ? 2592000 : 86400
    });
  } catch (error) {
    console.error('Login error:', error);
    return formatResponse(500, { error: 'Internal server error' });
  }
}

// Handle token verification
async function handleVerifyToken(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUserFromToken(event);
    if (!user) {
      return formatResponse(401, { error: 'Invalid or expired token' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    return formatResponse(200, {
      valid: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return formatResponse(401, { error: 'Invalid or expired token' });
  }
}

// Send verification email (placeholder)
async function sendVerificationEmail(userId: string): Promise<void> {
  try {
    console.log(`Would send verification email for user ${userId}`);
    // TODO: Implement actual email sending logic
  } catch (error) {
    console.error('Error sending verification email:', error);
    console.log('Continuing with registration despite email error');
  }
}

// Main Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Auth service event:', JSON.stringify(event, null, 2));
  
  const method = event.httpMethod;
  const path = event.path;

  try {
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return formatResponse(200, {});
    }

    // Route requests
    if (path === '/auth/register' && method === 'POST') {
      return await handleRegistration(event);
    } else if (path === '/auth/login' && method === 'POST') {
      return await handleLogin(event);
    } else if (path === '/auth/verify' && method === 'GET') {
      return await handleVerifyToken(event);
    }

    return formatResponse(404, { error: 'Endpoint not found' });
  } catch (error) {
    console.error('Handler error:', error);
    return formatResponse(500, { error: 'Internal server error' });
  }
};
