# Outputs for Peptide Tracker Lambda Infrastructure

output "infrastructure_summary" {
  description = "Summary of created infrastructure"
  value = {
    region                = data.aws_region.current.name
    account_id           = data.aws_caller_identity.current.account_id
    lambda_role_arn      = aws_iam_role.lambda_execution_role.arn
    users_table          = aws_dynamodb_table.users.name
    sessions_table       = aws_dynamodb_table.sessions.name
    jwt_secret_name      = aws_secretsmanager_secret.jwt_secret.name
    api_gateway_url      = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.environment}"
  }
}

output "github_secrets" {
  description = "Values to add as GitHub secrets"
  value = {
    AWS_LAMBDA_ROLE_ARN = aws_iam_role.lambda_execution_role.arn
    AWS_REGION         = data.aws_region.current.name
    USERS_TABLE_NAME   = aws_dynamodb_table.users.name
    SESSIONS_TABLE_NAME = aws_dynamodb_table.sessions.name
    JWT_SECRET_NAME    = aws_secretsmanager_secret.jwt_secret.name
  }
  sensitive = false
}
