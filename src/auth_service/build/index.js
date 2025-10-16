"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const jwt = __importStar(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const crypto_1 = require("crypto");
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
const client = new client_dynamodb_1.DynamoDBClient({});
const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const secretsClient = new client_secrets_manager_1.SecretsManagerClient({});
async function getJwtSecret() {
    try {
        const command = new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: 'peptide-tracker/jwt-secret'
        });
        const response = await secretsClient.send(command);
        return response.SecretString || '';
    }
    catch (error) {
        console.error('Error getting JWT secret:', error);
        throw new Error('JWT secret not found');
    }
}
async function generateToken(user, sessionId, tokenVersion, expiresIn = '24h') {
    const secret = await getJwtSecret();
    return jwt.sign({
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        status: user.status,
        session_id: sessionId,
        token_version: tokenVersion
    }, secret, { expiresIn: expiresIn });
}
function generateRefreshToken() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
async function createSession(user, ipAddress, userAgent, deviceFingerprint) {
    const sessionsTable = process.env['SESSIONS_TABLE_NAME'];
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
    await dynamodb.send(new lib_dynamodb_1.PutCommand({
        TableName: sessionsTable,
        Item: session
    }));
    return { accessToken, refreshToken, session };
}
async function verifyToken(token) {
    const secret = await getJwtSecret();
    return jwt.verify(token, secret);
}
async function hashPassword(password) {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function formatResponse(statusCode, body) {
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
async function getUserFromToken(event) {
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.substring(7);
        const decoded = await verifyToken(token);
        const command = new lib_dynamodb_1.GetCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: decoded.user_id }
        });
        const response = await dynamodb.send(command);
        return response.Item || null;
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}
async function handleRegistration(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { name, email, password, organization, department } = body;
        if (!name || !email || !password) {
            return formatResponse(400, { error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return formatResponse(400, { error: 'Password must be at least 6 characters long' });
        }
        const existingUserCommand = new lib_dynamodb_1.QueryCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        });
        const existingUser = await dynamodb.send(existingUserCommand);
        if (existingUser.Items && existingUser.Items.length > 0) {
            return formatResponse(409, { error: 'User with this email already exists' });
        }
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
        const putCommand = new lib_dynamodb_1.PutCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Item: user
        });
        await dynamodb.send(putCommand);
        try {
            await sendVerificationEmail(user.user_id);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }
        const sessionId = generateUUID();
        const token = await generateToken(user, sessionId, 1, '24h');
        const { password_hash, ...userWithoutPassword } = user;
        return formatResponse(201, {
            token,
            user: userWithoutPassword,
            expires_in: 86400,
            message: 'Registration successful. Please check your email to verify your account.'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
async function handleLogin(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { email, password, remember_me, device_fingerprint } = body;
        if (!email || !password) {
            return formatResponse(400, { error: 'Email and password are required' });
        }
        const queryCommand = new lib_dynamodb_1.QueryCommand({
            TableName: process.env['USERS_TABLE_NAME'],
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
        const updateCommand = new lib_dynamodb_1.UpdateCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: user.user_id },
            UpdateExpression: 'SET last_login = :last_login, updated_at = :updated_at',
            ExpressionAttributeValues: {
                ':last_login': new Date().toISOString(),
                ':updated_at': new Date().toISOString()
            }
        });
        await dynamodb.send(updateCommand);
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
    }
    catch (error) {
        console.error('Login error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
async function handleVerifyToken(event) {
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
    }
    catch (error) {
        console.error('Token verification error:', error);
        return formatResponse(401, { error: 'Invalid or expired token' });
    }
}
async function handleUpdateProfile(event) {
    try {
        const user = await getUserFromToken(event);
        if (!user) {
            return formatResponse(401, { error: 'Unauthorized' });
        }
        const body = JSON.parse(event.body || '{}');
        const { name, email, organization, department, phone } = body;
        if (email && email !== user.email) {
            const existingUserCommand = new lib_dynamodb_1.QueryCommand({
                TableName: process.env['USERS_TABLE_NAME'],
                IndexName: 'EmailIndex',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: { ':email': email.toLowerCase() }
            });
            const existingUser = await dynamodb.send(existingUserCommand);
            if (existingUser.Items && existingUser.Items.length > 0) {
                return formatResponse(409, { error: 'Email already in use' });
            }
        }
        let updateExpression = 'SET updated_at = :updated_at';
        const expressionAttributeValues = {
            ':updated_at': new Date().toISOString()
        };
        if (name) {
            updateExpression += ', #name = :name';
            expressionAttributeValues[':name'] = name;
        }
        if (email) {
            updateExpression += ', email = :email, email_verified = :email_verified';
            expressionAttributeValues[':email'] = email.toLowerCase();
            expressionAttributeValues[':email_verified'] = false;
        }
        if (organization || department || phone) {
            updateExpression += ', profile = :profile';
            expressionAttributeValues[':profile'] = {
                ...user.profile,
                ...(organization && { organization }),
                ...(department && { department }),
                ...(phone && { phone })
            };
        }
        const updateCommand = new lib_dynamodb_1.UpdateCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: user.user_id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: {
                '#name': 'name'
            }
        });
        await dynamodb.send(updateCommand);
        const getCommand = new lib_dynamodb_1.GetCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: user.user_id }
        });
        const response = await dynamodb.send(getCommand);
        const updatedUser = response.Item;
        const { password_hash, ...userWithoutPassword } = updatedUser;
        return formatResponse(200, {
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
async function handleChangePassword(event) {
    try {
        const user = await getUserFromToken(event);
        if (!user) {
            return formatResponse(401, { error: 'Unauthorized' });
        }
        const body = JSON.parse(event.body || '{}');
        const { current_password, new_password } = body;
        if (!current_password || !new_password) {
            return formatResponse(400, { error: 'Current password and new password are required' });
        }
        if (new_password.length < 6) {
            return formatResponse(400, { error: 'New password must be at least 6 characters long' });
        }
        const isValidPassword = await verifyPassword(current_password, user.password_hash);
        if (!isValidPassword) {
            return formatResponse(401, { error: 'Current password is incorrect' });
        }
        const newPasswordHash = await hashPassword(new_password);
        const updateCommand = new lib_dynamodb_1.UpdateCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: user.user_id },
            UpdateExpression: 'SET password_hash = :password_hash, updated_at = :updated_at',
            ExpressionAttributeValues: {
                ':password_hash': newPasswordHash,
                ':updated_at': new Date().toISOString()
            }
        });
        await dynamodb.send(updateCommand);
        return formatResponse(200, { message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Password change error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
async function handlePasswordResetRequest(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { email } = body;
        if (!email) {
            return formatResponse(400, { error: 'Email is required' });
        }
        const queryCommand = new lib_dynamodb_1.QueryCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email.toLowerCase() }
        });
        const response = await dynamodb.send(queryCommand);
        if (!response.Items || response.Items.length === 0) {
            return formatResponse(200, { message: 'If the email exists, a password reset link has been sent' });
        }
        const user = response.Items[0];
        const resetToken = generateUUID();
        const resetExpiry = new Date(Date.now() + 3600000).toISOString();
        const updateCommand = new lib_dynamodb_1.UpdateCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: user.user_id },
            UpdateExpression: 'SET reset_token = :reset_token, reset_token_expiry = :reset_token_expiry, updated_at = :updated_at',
            ExpressionAttributeValues: {
                ':reset_token': resetToken,
                ':reset_token_expiry': resetExpiry,
                ':updated_at': new Date().toISOString()
            }
        });
        await dynamodb.send(updateCommand);
        console.log(`Password reset token for ${email}: ${resetToken}`);
        return formatResponse(200, { message: 'If the email exists, a password reset link has been sent' });
    }
    catch (error) {
        console.error('Password reset request error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
async function handleUserList(event) {
    try {
        const user = await getUserFromToken(event);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return formatResponse(403, { error: 'Admin access required' });
        }
        const scanCommand = new lib_dynamodb_1.ScanCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            ProjectionExpression: 'user_id, email, name, role, status, created_at, last_login, email_verified'
        });
        const response = await dynamodb.send(scanCommand);
        const users = response.Items?.map(user => {
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }) || [];
        return formatResponse(200, {
            users,
            total: users.length
        });
    }
    catch (error) {
        console.error('User list error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
async function handleUserStatusUpdate(event) {
    try {
        const user = await getUserFromToken(event);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return formatResponse(403, { error: 'Admin access required' });
        }
        const userId = event.pathParameters?.['userId'];
        if (!userId) {
            return formatResponse(400, { error: 'User ID is required' });
        }
        const body = JSON.parse(event.body || '{}');
        const { status, role } = body;
        if (!status && !role) {
            return formatResponse(400, { error: 'Status or role is required' });
        }
        let updateExpression = 'SET updated_at = :updated_at';
        const expressionAttributeValues = {
            ':updated_at': new Date().toISOString()
        };
        if (status) {
            updateExpression += ', #status = :status';
            expressionAttributeValues[':status'] = status;
        }
        if (role) {
            updateExpression += ', #role = :role';
            expressionAttributeValues[':role'] = role;
        }
        const updateCommand = new lib_dynamodb_1.UpdateCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            Key: { user_id: userId },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: {
                '#status': 'status',
                '#role': 'role'
            }
        });
        await dynamodb.send(updateCommand);
        return formatResponse(200, { message: 'User updated successfully' });
    }
    catch (error) {
        console.error('User status update error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
const handler = async (event) => {
    console.log('Auth service event:', JSON.stringify(event, null, 2));
    const method = event.httpMethod;
    const path = event.path;
    try {
        if (method === 'OPTIONS') {
            return formatResponse(200, {});
        }
        if (path === '/auth/register' && method === 'POST') {
            return await handleRegistration(event);
        }
        else if (path === '/auth/login' && method === 'POST') {
            return await handleLogin(event);
        }
        else if (path === '/auth/verify' && method === 'GET') {
            return await handleVerifyToken(event);
        }
        else if (path === '/auth/profile' && method === 'PUT') {
            return await handleUpdateProfile(event);
        }
        else if (path === '/auth/change-password' && method === 'POST') {
            return await handleChangePassword(event);
        }
        else if (path === '/auth/reset-password' && method === 'POST') {
            return await handlePasswordResetRequest(event);
        }
        else if (path === '/auth/users' && method === 'GET') {
            return await handleUserList(event);
        }
        else if (path.match(/^\/auth\/users\/[^\/]+\/status$/) && method === 'PUT') {
            return await handleUserStatusUpdate(event);
        }
        else if (path === '/auth/resend-verification' && method === 'POST') {
            return await handleResendVerification(event);
        }
        return formatResponse(404, { error: 'Endpoint not found' });
    }
    catch (error) {
        console.error('Handler error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
};
exports.handler = handler;
async function sendVerificationEmail(userId) {
    try {
        console.log(`Would send verification email for user ${userId}`);
    }
    catch (error) {
        console.error('Error sending verification email:', error);
        console.log('Continuing with registration despite email error');
    }
}
async function handleResendVerification(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { email } = body;
        if (!email) {
            return formatResponse(400, { error: 'Email is required' });
        }
        const queryCommand = new lib_dynamodb_1.QueryCommand({
            TableName: process.env['USERS_TABLE_NAME'],
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email.toLowerCase() }
        });
        const response = await dynamodb.send(queryCommand);
        if (!response.Items || response.Items.length === 0) {
            return formatResponse(404, { error: 'User not found' });
        }
        const user = response.Items[0];
        if (user.email_verified) {
            return formatResponse(400, { error: 'Email already verified' });
        }
        try {
            await sendVerificationEmail(user.user_id);
        }
        catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
            return formatResponse(500, { error: 'Failed to send verification email' });
        }
        return formatResponse(200, {
            message: 'Verification email sent successfully',
            email: user.email
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        return formatResponse(500, { error: 'Internal server error' });
    }
}
//# sourceMappingURL=index.js.map