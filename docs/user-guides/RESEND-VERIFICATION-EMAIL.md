# Resend Verification Email Feature

## Overview

If you've signed up but didn't receive the verification email, you can now request it to be resent using your email address.

---

## How to Resend Verification Email

### Option 1: Using the API Endpoint

**Endpoint**: `POST /api/onboarding/verify-email/resend-by-email`

**Request**:
```json
{
  "email": "your-email@example.com"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Verification email has been sent. Please check your inbox and spam folder."
}
```

**Response (Already Verified)**:
```json
{
  "success": false,
  "message": "This email address has already been verified. You can log in with your credentials."
}
```

**Response (User Not Found)**:
```json
{
  "success": true,
  "message": "If an account exists with this email and is unverified, a verification email has been sent."
}
```

**Note**: For security reasons, the endpoint returns the same success message whether the user exists or not. This prevents email enumeration attacks.

### Option 2: Using cURL

```bash
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/onboarding/verify-email/resend-by-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### Option 3: From Frontend (When Implemented)

The frontend can add a "Resend Verification Email" button on the login page or signup success page that calls this endpoint.

---

## What Happens When You Resend

1. **New Verification Token Generated**: A fresh verification token is created (previous token is invalidated)
2. **Token Expires in 24 Hours**: The new token is valid for 24 hours
3. **Email Sent**: A verification email is sent to your email address
4. **Check Spam Folder**: Make sure to check your spam/junk folder if you don't see it in your inbox

---

## Security Features

- **Email Enumeration Protection**: The endpoint doesn't reveal whether an email exists in the system
- **Rate Limiting**: (To be implemented) Prevents abuse by limiting requests per email/IP
- **Token Invalidation**: Previous verification tokens are invalidated when a new one is generated
- **Public Endpoint**: No authentication required, so users can resend even if they can't log in

---

## Common Scenarios

### Scenario 1: Email Not Received After Signup

1. Go to the resend verification endpoint
2. Enter your email address
3. Check your inbox and spam folder
4. Click the verification link in the email
5. Log in with your credentials

### Scenario 2: Verification Link Expired

1. Request a new verification email using the resend endpoint
2. A new link will be sent (valid for 24 hours)
3. Click the new link to verify your email

### Scenario 3: Email Already Verified

If you try to resend but your email is already verified, you'll get a message telling you to log in instead.

---

## Error Messages

| Message | Meaning | Action |
|---------|---------|--------|
| "Verification email has been sent..." | ✅ Email sent successfully | Check your inbox and spam folder |
| "This email address has already been verified..." | ✅ Email already verified | Just log in with your credentials |
| "Failed to send verification email..." | ❌ Email service error | Try again later or contact support |
| "If an account exists..." | 🔒 Security response | Check your email (same message whether user exists or not) |

---

## Integration with Signup Flow

When you try to sign up with an email that's already registered:

- **If email is verified**: You'll get "Email already registered. Please sign in."
- **If email is NOT verified**: You'll get "Email already registered but not verified. Please check your email for the verification link, or use the resend verification feature."

This helps users understand they need to verify their email before they can log in.

---

## Technical Details

### Endpoint Details

- **Method**: POST
- **Path**: `/api/onboarding/verify-email/resend-by-email`
- **Authentication**: None (Public endpoint)
- **Rate Limiting**: (To be implemented)

### Request Body

```typescript
{
  email: string; // Email address to resend verification to
}
```

### Response

```typescript
{
  success: boolean;
  message: string;
  error?: string; // Only present if success is false
}
```

---

## Testing

### Test with cURL

```bash
# Test resend for existing unverified user
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/onboarding/verify-email/resend-by-email \
  -H "Content-Type: application/json" \
  -d '{"email":"mayankrathee1@gmail.com"}'

# Test resend for non-existent email (should return same success message)
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/onboarding/verify-email/resend-by-email \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}'
```

---

## Future Enhancements

- [ ] Add rate limiting to prevent abuse
- [ ] Add frontend UI for resending verification
- [ ] Add email templates with "Resend" button
- [ ] Track resend attempts for analytics
- [ ] Add cooldown period between resend requests

