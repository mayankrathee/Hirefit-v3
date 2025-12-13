# Signup Flow with Email Verification

## Overview

HireFit now requires email verification for all new accounts created via email/password signup. This ensures account security and prevents unauthorized access.

---

## New Signup Flow

### **Step 1: User Signs Up**

1. User visits `/signup` page
2. Fills form with:
   - First Name
   - Last Name
   - Email Address
   - Password (minimum 8 characters)
3. Clicks **"Create Free Account"**

### **Step 2: Account Creation**

**Backend Process**:
- Password is hashed with bcrypt (10 rounds)
- Personal workspace is created
- User account is created with `emailVerified: false`
- Verification token is generated (expires in 24 hours)
- Verification email is sent automatically

### **Step 3: Email Verification Required**

**User sees success page with:**
- ✅ "Check your email!" message
- ✅ Email address displayed
- ✅ Instructions to verify account
- ✅ Free plan details
- ✅ "Go to Login Page" button

**User must:**
1. Check their email inbox
2. Click the verification link
3. Email is verified automatically
4. Welcome email is sent

### **Step 4: Login After Verification**

Once email is verified, user can:
1. Go to `/login` page
2. Enter email and password
3. Log in successfully
4. Access dashboard

---

## Email Verification Details

### **Verification Email Contents**

- **Subject**: "Verify your email - HireFit"
- **Content**: 
  - Welcome message
  - Verification link (valid for 24 hours)
  - Instructions
  - Support contact

### **Verification Link Format**

```
https://hirefit.io/verify-email?token=<verification-token>
```

### **Backend Verification Process**

1. User clicks verification link
2. Backend receives token via `GET /api/onboarding/verify-email?token=...`
3. Backend validates token:
   - Checks token exists
   - Checks token hasn't expired (24 hours)
   - Verifies user account
4. Email marked as verified:
   - `emailVerified: true`
   - `emailVerifiedAt: current timestamp`
   - Verification token cleared
5. Welcome email sent
6. User can now log in

---

## OAuth Signup (No Verification Required)

### **Google OAuth**
- User clicks "Sign in with Google"
- Authenticates with Google
- Account is auto-created if new
- **Email is auto-verified** (Google verifies emails)
- User is immediately logged in

### **Microsoft OAuth**
- User clicks "Sign in with Microsoft"
- Authenticates with Microsoft
- Account is created if auto-provision enabled
- **Email is auto-verified** (Microsoft verifies emails)
- User is immediately logged in

---

## User Flow After Signup

```
1. User fills signup form (name, email, password)
   ↓
2. Account created successfully
   ↓
3. Verification email sent automatically
   ↓
4. Success page appears with:
   - ✅ "Check your email!" message
   - ✅ Email address displayed
   - ✅ Instructions to verify
   - ✅ Free plan details
   - ✅ "Go to Login Page" button
   ↓
5. User checks email and clicks verification link
   ↓
6. Email verified automatically
   ↓
7. Welcome email sent
   ↓
8. User goes to login page
   ↓
9. User enters email and password
   ↓
10. User logged in and redirected to dashboard ✅
```

---

## Resending Verification Email

If user doesn't receive verification email:

1. User can request resend (if feature available)
2. Or contact support
3. New verification token generated
4. New email sent (previous token invalidated)

**Endpoint**: `POST /api/onboarding/verify-email/resend` (requires authentication)

---

## Security Benefits

### **Email Verification Prevents:**
- ✅ Unauthorized account creation
- ✅ Email typos causing account issues
- ✅ Spam account creation
- ✅ Access without email ownership

### **Password Security:**
- ✅ Passwords hashed with bcrypt
- ✅ Never stored in plain text
- ✅ Minimum 8 characters required
- ✅ Validated on every login

---

## Technical Details

### **Signup Endpoint**

**POST** `/api/tenants/signup`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "workspace": {
    "id": "...",
    "name": "John's Workspace",
    "slug": "john-doe",
    "type": "personal"
  },
  "user": {
    "id": "...",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "tenant_admin"
  },
  "limits": {
    "maxJobs": 3,
    "maxCandidates": 50,
    "maxAiScoresPerMonth": 20
  }
}
```

### **Verification Endpoint**

**GET** `/api/onboarding/verify-email?token=<token>`

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### **Email Service Configuration**

```env
EMAIL_PROVIDER=azure  # or 'console' for development
AZURE_COMMUNICATION_CONNECTION_STRING=<connection-string>
AZURE_EMAIL_SENDER_ADDRESS=DoNotReply@hirefit.io
APP_URL=https://hirefit.io
```

---

## Testing the Signup Flow

### **Test Steps:**

1. Go to `/signup`
2. Fill in the form:
   - First Name: "Test"
   - Last Name: "User"
   - Email: your-email@example.com
   - Password: testpassword123
3. Click "Create Free Account"
4. You should see:
   - Success message
   - "Check your email!" message
   - Your email address displayed
   - Free plan details
   - "Go to Login Page" button
5. Check your email inbox
6. Click verification link
7. Email verified (you'll see confirmation)
8. Go to login page
9. Enter email and password
10. You should be logged in and redirected to dashboard

---

## Common Issues

### **Issue: Verification email not received**

**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes (email delivery can be delayed)
- Check email service logs
- Request resend if available

### **Issue: Verification link expired**

**Solutions**:
- Request new verification email
- Token expires after 24 hours
- New token invalidates old one

### **Issue: "Email already verified"**

**Cause**: User already verified their email

**Solution**: 
- User can proceed directly to login
- No action needed

### **Issue: "Invalid verification token"**

**Cause**: Token is invalid or expired

**Solution**:
- Request new verification email
- Use the latest verification link

---

## Next Steps for Users

After signup, users should:

1. **Check Email**: Look for verification email
2. **Verify Account**: Click verification link
3. **Login**: Go to login page and enter credentials
4. **Start Using**: Access dashboard and create first job

**Alternative**: Users can use OAuth (Google/Microsoft) to skip email verification

---

## Migration Notes

### **For Existing Users**

- Existing accounts created before this update may not have verified emails
- These users should verify their email on next login
- Or use OAuth login (auto-verifies)

### **For Administrators**

- Monitor email delivery rates
- Check spam filter settings
- Ensure email service is properly configured
- Consider adding resend verification feature

---

**Last Updated**: January 2025  
**Status**: ✅ Implemented with Email Verification
