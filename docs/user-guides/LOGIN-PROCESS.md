# HireFit Login Process Guide

## Overview

HireFit supports multiple secure authentication methods with email verification. This guide explains the complete login process for both **new users** (who need to sign up first) and **existing users**.

---

## 🔐 Authentication Methods

### 1. **Email/Password Authentication** (Primary Method)
- **Who**: All users
- **Flow**: Sign up → Verify email → Login with email/password
- **Security**: Password hashed with bcrypt, email verification required
- **Endpoints**: 
  - `POST /api/tenants/signup` (signup)
  - `POST /api/auth/login` (login)

### 2. **Google OAuth** (Social Login)
- **Who**: Users with Google accounts
- **Flow**: Click "Sign in with Google" → OAuth → Auto-login
- **Security**: Email auto-verified (Google verifies emails)
- **Endpoint**: `GET /api/auth/google/login`

### 3. **Microsoft OAuth** (Enterprise SSO)
- **Who**: Users in organizations with Azure AD configured
- **Flow**: Click "Sign in with Microsoft" → OAuth → Auto-login
- **Security**: Email auto-verified (Microsoft verifies emails)
- **Endpoint**: `GET /api/auth/azure-ad/login`

---

## 📋 Complete Login Flow for New Users

### **Step 1: User Visits Login Page**

**URL**: `https://hirefit-web-beta...azurecontainerapps.io/login`

The user sees:
- **"Sign in with Google"** button
- **"Sign in with Microsoft"** button (if Azure AD configured)
- **Email/Password login form**
- **"Don't have an account? Sign up"** link

### **Step 2: New User Chooses Sign Up**

**Option A: Email/Password Signup** (Recommended for new users)

1. User clicks **"Sign up"** link
2. Redirected to `/signup` page
3. User fills form:
   - First Name
   - Last Name
   - Email Address
   - Password (minimum 8 characters)
4. User clicks **"Create Account"**

**Backend Process** (`POST /api/tenants/signup`):

```typescript
// 1. Create Personal Workspace (Tenant)
- Generate unique slug from user's name
- Create tenant with type: 'personal'
- Set subscription tier: 'free'
- Set default limits (20 AI scores/month, etc.)

// 2. Create User Account
- Hash password with bcrypt (10 rounds)
- Create user with role: 'tenant_admin'
- Link user to workspace
- Set user as workspace owner
- Generate email verification token
- Set emailVerified: false

// 3. Send Verification Email
- Generate verification link with token
- Send email via EmailService
- Token expires in 24 hours

// 4. Initialize Features
- Auto-seed feature definitions (if not already done)
- Enable 'core' feature (always enabled)
- Enable 'ai_screening' feature with 20/month limit
- Create TenantFeature records

// 5. Return Response
- Workspace info (slug, limits)
- User info (email, name, role)
```

**Frontend Response**:
- Shows success message with email verification instructions
- Displays workspace info
- **User is NOT automatically logged in** after signup
- User must verify email before logging in
- User can go to login page after verification

### **Step 3: Email Verification**

1. User receives verification email
2. User clicks verification link
3. Backend verifies token (`GET /api/onboarding/verify-email?token=...`)
4. Email marked as verified
5. Welcome email sent
6. User can now log in

### **Step 4: New User Logs In**

After email verification, the user can log in using any of these methods:

#### **Option 1: Email/Password Login**

1. User goes to `/login` page
2. Enters email and password
3. Optionally enters organization slug
4. Clicks **"Sign in"**

**Backend Process** (`POST /api/auth/login`):

```typescript
// 1. Find User
- Search for user by email (globally)
- If not found, return "Invalid email or password"

// 2. Verify Password
- Compare provided password with stored hash
- If invalid, return "Invalid email or password"

// 3. Check Email Verification
- If email not verified, return error:
  "Please verify your email before logging in. Check your inbox for the verification link."

// 4. Check Account Status
- If account inactive, return error
- If tenant slug provided, verify it matches user's tenant

// 5. Generate Tokens
- Create JWT access token (1 hour expiry)
- Create JWT refresh token (7 days expiry)
- Update last login timestamp
- Include user and tenant info in response

// 6. Return Tokens
{
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
  expiresIn: 3600,
  tokenType: "Bearer",
  user: {
    id: "...",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "tenant_admin",
    tenantId: "...",
    tenantName: "John's Workspace"
  }
}
```

**Frontend Process**:

```typescript
// 1. Store Tokens
localStorage.setItem('accessToken', result.accessToken);
localStorage.setItem('refreshToken', result.refreshToken);
localStorage.setItem('user', JSON.stringify(result.user));

// 2. Set Auth State
setAccessToken(result.accessToken);
setUser(result.user);

// 3. Redirect
router.push('/dashboard');
```

#### **Option 2: Google OAuth Login**

1. User clicks **"Sign in with Google"** button
2. Frontend redirects to: `/api/auth/google/login?redirect_uri=...`
3. Backend redirects to Google OAuth consent screen
4. User authenticates with Google
5. Google redirects back with authorization code
6. Backend exchanges code for tokens
7. Backend finds or creates user (email auto-verified)
8. Backend redirects to frontend with tokens in URL
9. Frontend stores tokens and redirects to dashboard

**Backend Process** (`handleGoogleCallback`):

```typescript
// 1. Find User
- Search by Google user ID (externalId: "google:sub")
- If not found, search by email globally
- If found but no externalId, link Google account

// 2. Create User (if new)
- If user doesn't exist, create personal workspace
- Create user account with Google ID
- Mark email as verified (Google verifies emails)
- Initialize features for free tier

// 3. Generate Tokens
- Create JWT tokens
- Update last login timestamp

// 4. Redirect to Frontend
- Include tokens in URL query params
- Frontend callback page processes tokens
```

#### **Option 3: Microsoft OAuth Login**

1. User clicks **"Sign in with Microsoft"** button
2. Frontend redirects to: `/api/auth/azure-ad/login?redirect_uri=...`
3. Backend redirects to Microsoft login page
4. User authenticates with Microsoft
5. Microsoft redirects back with authorization code
6. Backend exchanges code for tokens
7. Backend finds or creates user (email auto-verified)
8. Backend redirects to frontend with tokens in URL
9. Frontend stores tokens and redirects to dashboard

**Backend Process** (`handleAzureAdCallback`):

```typescript
// 1. Find User
- Search by Azure AD Object ID (externalId)
- If not found, search by email within tenant
- If still not found and auto-provision enabled, create user

// 2. Mark Email Verified
- Microsoft OAuth users have verified emails
- Set emailVerified: true
- Set emailVerifiedAt: current timestamp

// 3. Generate Tokens
- Create JWT tokens
- Update last login timestamp

// 4. Redirect to Frontend
- Include tokens in URL query params
- Frontend callback page processes tokens
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. User visits /login
   │
   ├─→ Clicks "Sign up"
   │   │
   │   └─→ Fills signup form (name, email, password)
   │       │
   │       └─→ POST /api/tenants/signup
   │           │
   │           ├─→ Hash password with bcrypt
   │           ├─→ Create Personal Workspace
   │           ├─→ Create User Account (emailVerified: false)
   │           ├─→ Generate verification token
   │           ├─→ Send verification email
   │           ├─→ Initialize Features (core, ai_screening)
   │           └─→ Return workspace info
   │
   │       └─→ User sees success message
   │           └─→ "Check your email" message
   │
   │   └─→ User clicks verification link in email
   │       │
   │       └─→ GET /api/onboarding/verify-email?token=...
   │           │
   │           ├─→ Verify token (check expiry)
   │           ├─→ Set emailVerified: true
   │           ├─→ Send welcome email
   │           └─→ Return success
   │
   │       └─→ User can now log in
   │
   └─→ Clicks "Sign in with Google" or "Sign in with Microsoft"
       │
       ├─→ Google OAuth
       │   │
       │   └─→ GET /api/auth/google/login
       │       │
       │       └─→ Redirect to Google
       │           │
       │           └─→ User authenticates
       │               │
       │               └─→ Google callback
       │                   │
       │                   └─→ Exchange code for tokens
       │                       │
       │                       └─→ Find/Create user
       │                           │
       │                           ├─→ Email auto-verified
       │                           └─→ Redirect to frontend with tokens
       │                               │
       │                               └─→ Frontend stores tokens
       │                                   └─→ Redirect to /dashboard ✅
       │
       └─→ Microsoft OAuth
           │
           └─→ GET /api/auth/azure-ad/login
               │
               └─→ Redirect to Microsoft
                   │
                   └─→ User authenticates
                       │
                       └─→ Microsoft callback
                           │
                           └─→ Exchange code for tokens
                               │
                               └─→ Find/Create user
                                   │
                                   ├─→ Email auto-verified
                                   └─→ Redirect to frontend with tokens
                                       │
                                       └─→ Frontend stores tokens
                                           └─→ Redirect to /dashboard ✅

┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING USER LOGIN                           │
└─────────────────────────────────────────────────────────────────┘

1. User visits /login
   │
   ├─→ Email/Password Login
   │   │
   │   └─→ Enters email and password
   │       │
   │       └─→ POST /api/auth/login
   │           │
   │           ├─→ Verify password
   │           ├─→ Check email verified
   │           ├─→ Generate JWT tokens
   │           └─→ Return tokens + user info
   │
   │       └─→ Frontend stores tokens
   │           └─→ Redirect to /dashboard ✅
   │
   └─→ OAuth Login (Google/Microsoft)
       │
       └─→ Same flow as new user OAuth
           └─→ Redirect to /dashboard ✅
```

---

## 🔑 Token Management

### **Access Token**
- **Type**: JWT (JSON Web Token)
- **Expiry**: 1 hour
- **Contains**: User ID, email, tenant ID, roles, permissions
- **Storage**: `localStorage.getItem('accessToken')`
- **Usage**: Sent in `Authorization: Bearer <token>` header

### **Refresh Token**
- **Type**: JWT
- **Expiry**: 7 days
- **Contains**: User ID, type: 'refresh'
- **Storage**: `localStorage.getItem('refreshToken')`
- **Usage**: Used to get new access token when expired

### **Token Refresh Flow**

```typescript
// When access token expires:
1. Frontend detects 401 response
2. Calls POST /api/auth/refresh with refreshToken
3. Backend validates refresh token
4. Backend generates new access + refresh tokens
5. Frontend updates stored tokens
6. Retry original request with new token
```

---

## 🛡️ Security Features

### **1. Password Security**
- Passwords hashed with bcrypt (10 rounds)
- Never stored in plain text
- Minimum 8 characters required
- Passwords validated on login

### **2. Email Verification**
- Required for email/password accounts
- Verification token expires in 24 hours
- OAuth accounts auto-verified (Google/Microsoft verify emails)
- Users cannot log in until email is verified

### **3. JWT Token Validation**
- Tokens are signed with secret key
- Backend validates signature on every request
- Invalid tokens result in 401 Unauthorized

### **4. Tenant Isolation**
- Every request includes `X-Tenant-ID` header
- Backend verifies user belongs to tenant
- Users cannot access other tenants' data

### **5. Role-Based Access Control**
- Each user has a role (tenant_admin, member, viewer)
- Roles determine what actions are allowed
- Enforced by `@Roles()` decorator on endpoints

### **6. Session Management**
- Tokens stored in browser localStorage
- No server-side session storage (stateless)
- Logout clears localStorage tokens

---

## 📱 Frontend Authentication State

### **Auth Context Provider**

The frontend uses React Context to manage auth state:

```typescript
interface AuthContextType {
  user: User | null;              // Current user object
  accessToken: string | null;      // JWT access token
  isLoading: boolean;             // Loading state
  isAuthenticated: boolean;        // Computed from user
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  loginWithGoogle: (tenantSlug?: string) => void;
  loginWithMicrosoft: (tenantSlug?: string) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### **Protected Routes**

Routes are protected using middleware:

```typescript
// If not authenticated:
- Redirect to /login
- Store intended destination
- After login, redirect to intended destination

// If authenticated:
- Allow access to route
- Include access token in API requests
- Include X-Tenant-ID header
```

---

## 🚨 Common Scenarios

### **Scenario 1: New User Signs Up**

1. User visits `/signup`
2. Fills form (name, email, password) and submits
3. Account created, workspace initialized
4. Verification email sent
5. User sees "Check your email" message
6. User clicks verification link in email
7. Email verified, welcome email sent
8. User goes to `/login`
9. User enters email and password
10. User is logged in and redirected to dashboard

### **Scenario 2: Existing User Logs In**

1. User visits `/login`
2. User enters email and password (or clicks OAuth button)
3. Backend verifies credentials and email verification
4. Tokens generated
5. User redirected to dashboard

### **Scenario 3: User Forgets to Verify Email**

1. User signs up
2. User tries to log in before verifying email
3. Backend returns error: "Please verify your email before logging in"
4. User checks email and clicks verification link
5. User can now log in

### **Scenario 4: Token Expires**

1. User makes API request
2. Backend returns 401 (token expired)
3. Frontend automatically calls refresh endpoint
4. New tokens received
5. Original request retried
6. User continues working (seamless)

### **Scenario 5: User Logs Out**

1. User clicks logout button
2. Frontend clears localStorage:
   - `accessToken`
   - `refreshToken`
   - `user`
3. Auth context updated (user = null)
4. Redirect to `/login`

---

## 🔍 Troubleshooting

### **Issue: "Please verify your email before logging in"**

**Cause**: User hasn't verified their email address

**Solution**: 
- Check email inbox (and spam folder) for verification email
- Click the verification link
- If link expired, request a new verification email
- OAuth users (Google/Microsoft) don't need to verify (auto-verified)

### **Issue: "Invalid email or password"**

**Cause**: Wrong credentials or account doesn't exist

**Solution**: 
- Check email spelling
- Check password (case-sensitive)
- Try password reset (if available)
- Or use OAuth login instead

### **Issue: "User not found" after OAuth login**

**Cause**: User doesn't exist and auto-provision is disabled (for Microsoft)

**Solution**: 
- For Google: Account is auto-created
- For Microsoft: Enable auto-provision in tenant settings, OR
- Admin must create user account first

### **Issue: Verification email not received**

**Cause**: Email delivery issues or spam filter

**Solution**: 
- Check spam/junk folder
- Verify email address is correct
- Request resend verification email
- Check email service configuration

### **Issue: "Feature 'core' not found"**

**Cause**: Features not seeded in database

**Solution**: 
- Features auto-seed on module initialization
- If issue persists, check API logs for seeding errors

### **Issue: Token refresh fails**

**Cause**: Refresh token expired or invalid

**Solution**: 
- User must log in again
- Refresh tokens expire after 7 days

### **Issue: Cannot access dashboard**

**Cause**: Not authenticated or token invalid

**Solution**: 
- Check localStorage for tokens
- Try logging in again
- Clear browser cache if needed

---

## 📝 Summary

**For New Users:**
1. ✅ Sign up at `/signup` (creates account + workspace)
2. ✅ Check email and verify account
3. ✅ Go to `/login`
4. ✅ Enter email and password (or use OAuth)
5. ✅ Automatically logged in and redirected to dashboard

**For Existing Users:**
1. ✅ Go to `/login`
2. ✅ Enter email and password (or use OAuth)
3. ✅ Automatically logged in and redirected to dashboard

**Key Points:**
- **Email verification is required** for email/password accounts
- OAuth accounts (Google/Microsoft) are **auto-verified**
- Passwords are **hashed and secure**
- Tokens are stored in browser localStorage
- Tokens automatically refresh when expired
- Multiple login methods available for convenience

---

## 🔐 Authentication Methods Comparison

| Method | Email Verification | Password Required | Auto-Create Account | Best For |
|--------|-------------------|------------------|-------------------|----------|
| Email/Password | ✅ Required | ✅ Yes | ✅ Yes (on signup) | All users |
| Google OAuth | ✅ Auto-verified | ❌ No | ✅ Yes | Google users |
| Microsoft OAuth | ✅ Auto-verified | ❌ No | ⚠️ If enabled | Enterprise users |

---

**Last Updated**: January 2025  
**Version**: 2.0 (Email Verification & OAuth Update)
