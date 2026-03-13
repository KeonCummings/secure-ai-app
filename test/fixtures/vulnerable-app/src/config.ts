// Hardcoded secrets
const API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678";
const aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// Exposed sensitive env var
const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET;
const passwordSecret = process.env.NEXT_PUBLIC_PASSWORD_SECRET;

export { API_KEY, jwtSecret, passwordSecret };
