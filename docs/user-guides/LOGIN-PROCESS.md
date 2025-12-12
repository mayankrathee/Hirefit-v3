# HireFit Login Process Guide

## Overview

HireFit supports multiple authentication methods depending on your configuration. This guide explains the complete login process for both **new users** (who need to sign up first) and **existing users**.

---

## 🔐 Authentication Methods

### 1. **Email/Password Signup** (Primary for New Users)
- **Who**: New users creating their first account
- **Flow**: Sign up → Create workspace → Auto-login
- **Endpoint**: `POST /api/tenants/signup`

### 2. **Azure AD SSO** (Enterprise)
- **Who**: Users in organizations with Azure AD configured
- **Flow**: Redirect to Microsoft → OAuth → Auto-login
- **Endpoint**: `GET /api/auth/azure-ad/login`

### 3. **Demo Login** (Development/Testing)
- **Who**: Test users, developers, beta testers
- **Flow**: One-click login → Auto-create demo account
- **Endpoint**: `POST /api/auth/demo`

---

## 📋 Complete Login Flow for New Users

### **Step 1: User Visits Login Page**

**URL**: `https://hirefit-web-beta...azurecontainerapps.io/login`

The user sees:
- **"Sign in with Microsoft"** button (if Azure AD configured)
- **"Try Demo"** button (always available)
- **"Don't have an account? Sign up"** link

### **Step 2: New User Chooses Sign Up**

**Option A: Email/Password Signup** (Recommended for new users)

1. User clicks **"Sign up"** link
2. Redirected to `/signup` page
3. User fills form:
   - First Name
   - Last Name
   - Email Address
4. User clicks **"Create Account"**

**Backend Process** (`POST /api/tenants/signup`):

```typescript
// 1. Create Personal Workspace (Tenant)
- Generate unique slug from user's name
- Create tenant with type: 'personal'
- Set subscription tier: 'free'
- Set default limits (20 AI scores/month, etc.)

// 2. Create User Account
- Create user with role: 'tenant_admin'
- Link user to workspace
- Set user as workspace owner

// 3. Initialize Features
- Auto-seed feature definitions (if not already done)
- Enable 'core' feature (always enabled)
- Enable 'ai_screening' feature with 20/month limit
- Create TenantFeature records

// 4. Return Response
- Workspace info (slug, limits)
- User info (email, name, role)
```

**Frontend Response**:
- Shows success message
- Displays workspace info
- **User is NOT automatically logged in** after signup
- User must go back to login page

### **Step 3: New User Logs In After Signup**

After signup, the user needs to log in. They have three options:

#### **Option 1: Demo Login** (Easiest for Testing)

1. User clicks **"Try Demo"** button on login page
2. Frontend calls `POST /api/auth/demo`

**Backend Process**:

```typescript
// 1. Check/Create Demo Tenant
- Look for tenant with slug: 'demo-company'
- If not exists, create it

// 2. Check/Create Demo User
- Look for user: demo@hirefit.local
- If not exists, create with role: 'tenant_admin'

// 3. Generate Tokens
- Create JWT access token (1 hour expiry)
- Create JWT refresh token (7 days expiry)
- Include user and tenant info in response

// 4. Return Tokens
{
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
  expiresIn: 3600,
  tokenType: "Bearer",
  user: {
    id: "...",
    email: "demo@hirefit.local",
    firstName: "Demo",
    lastName: "User",
    role: "tenant_admin",
    tenantId: "...",
    tenantName: "Demo Company"
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

#### **Option 2: Azure AD Login** (If Configured)

1. User clicks **"Sign in with Microsoft"**
2. Frontend redirects to: `/api/auth/azure-ad/login?redirect_uri=...`
3. Backend redirects to Microsoft login page
4. User authenticates with Microsoft
5. Microsoft redirects back with authorization code
6. Backend exchanges code for tokens
7. Backend finds or creates user
8. Backend redirects to frontend with tokens in URL
9. Frontend stores tokens and redirects to dashboard

**Backend Process** (`handleAzureAdCallback`):

```typescript
// 1. Find User
- Search by Azure AD Object ID (externalId)
- If not found, search by email within tenant
- If still not found and auto-provision enabled, create user

// 2. Generate Tokens
- Create JWT tokens
- Update last login timestamp

// 3. Redirect to Frontend
- Include tokens in URL query params
- Frontend callback page processes tokens
```

#### **Option 3: Email/Password Login** (Not Currently Implemented)

Currently, HireFit uses:
- **Signup** → Creates account (no password required)
- **Login** → Uses Azure AD or Demo login

Email/password authentication is not implemented in the current version.

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
   │   └─→ Fills signup form (name, email)
   │       │
   │       └─→ POST /api/tenants/signup
   │           │
   │           ├─→ Create Personal Workspace
   │           ├─→ Create User Account
   │           ├─→ Initialize Features (core, ai_screening)
   │           └─→ Return workspace info
   │
   │       └─→ User sees success message
   │           └─→ Must go back to /login
   │
   └─→ Clicks "Try Demo" or "Sign in with Microsoft"
       │
       ├─→ Demo Login
       │   │
       │   └─→ POST /api/auth/demo
       │       │
       │       ├─→ Create/Find Demo Tenant
       │       ├─→ Create/Find Demo User
       │       ├─→ Generate JWT Tokens
       │       └─→ Return tokens + user info
       │
       │   └─→ Frontend stores tokens
       │       └─→ Redirect to /dashboard ✅
       │
       └─→ Azure AD Login
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
                                   └─→ Redirect to frontend with tokens
                                       │
                                       └─→ Frontend stores tokens
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

### **1. JWT Token Validation**
- Tokens are signed with secret key
- Backend validates signature on every request
- Invalid tokens result in 401 Unauthorized

### **2. Tenant Isolation**
- Every request includes `X-Tenant-ID` header
- Backend verifies user belongs to tenant
- Users cannot access other tenants' data

### **3. Role-Based Access Control**
- Each user has a role (tenant_admin, member, viewer)
- Roles determine what actions are allowed
- Enforced by `@Roles()` decorator on endpoints

### **4. Session Management**
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
  login: (tenantSlug?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
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
2. Fills form and submits
3. Account created, workspace initialized
4. User sees success message
5. User clicks "Go to Login"
6. User clicks "Try Demo" (or Azure AD login)
7. User is logged in and redirected to dashboard

### **Scenario 2: Existing User Logs In**

1. User visits `/login`
2. User clicks "Try Demo" (or Azure AD)
3. Backend finds existing user
4. Tokens generated
5. User redirected to dashboard

### **Scenario 3: Token Expires**

1. User makes API request
2. Backend returns 401 (token expired)
3. Frontend automatically calls refresh endpoint
4. New tokens received
5. Original request retried
6. User continues working (seamless)

### **Scenario 4: User Logs Out**

1. User clicks logout button
2. Frontend clears localStorage:
   - `accessToken`
   - `refreshToken`
   - `user`
3. Auth context updated (user = null)
4. Redirect to `/login`

---

## 🔍 Troubleshooting

### **Issue: "User not found" after Azure AD login**

**Cause**: User doesn't exist in database and auto-provision is disabled

**Solution**: 
- Enable auto-provision in tenant settings, OR
- Admin must create user account first

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
2. ✅ Go to `/login`
3. ✅ Click "Try Demo" or "Sign in with Microsoft"
4. ✅ Automatically logged in and redirected to dashboard

**For Existing Users:**
1. ✅ Go to `/login`
2. ✅ Click "Try Demo" or "Sign in with Microsoft"
3. ✅ Automatically logged in and redirected to dashboard

**Key Points:**
- Signup creates account but **does not log you in**
- You must log in separately after signup
- Demo login is easiest for testing
- Tokens are stored in browser localStorage
- Tokens automatically refresh when expired

---

**Last Updated**: December 12, 2025  
**Version**: Beta 1.0

