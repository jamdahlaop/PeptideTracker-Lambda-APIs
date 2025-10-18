-- DynamoDB Sessions Table Schema
-- This is a reference for the infrastructure team to create the sessions table

-- Table Name: peptide-tracker-sessions-dev
-- Primary Key: sessionId (String)

-- Sample item structure:
{
  "sessionId": "sess_1234567890abcdef",
  "userId": "user_12345",
  "isValid": true,
  "expiresAt": 1734567890000,
  "createdAt": 1734567890000,
  "lastAccessedAt": 1734567890000,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "loginMethod": "email",
    "deviceId": "device_123"
  }
}

-- AWS CLI command to create the table:
aws dynamodb create-table \
  --table-name peptide-tracker-sessions-dev \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

-- Sample data for testing:
aws dynamodb put-item \
  --table-name peptide-tracker-sessions-dev \
  --item '{
    "sessionId": {"S": "sess_1234567890abcdef"},
    "userId": {"S": "user_12345"},
    "isValid": {"BOOL": true},
    "expiresAt": {"N": "1734567890000"},
    "createdAt": {"N": "1734567890000"},
    "lastAccessedAt": {"N": "1734567890000"},
    "ipAddress": {"S": "192.168.1.1"},
    "userAgent": {"S": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    "metadata": {"M": {
      "loginMethod": {"S": "email"},
      "deviceId": {"S": "device_123"}
    }}
  }' \
  --region us-east-1
