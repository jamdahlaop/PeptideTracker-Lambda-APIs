# Local variables for development setup

variable "aws_access_key_id" {
  description = "AWS Access Key ID (leave empty to use AWS CLI config)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key (leave empty to use AWS CLI config)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "create_local_credentials" {
  description = "Whether to create a local .aws-credentials.env file"
  type        = bool
  default     = false
}

variable "github_token" {
  description = "GitHub personal access token (leave empty to use GitHub CLI)"
  type        = string
  default     = ""
  sensitive   = true
}
