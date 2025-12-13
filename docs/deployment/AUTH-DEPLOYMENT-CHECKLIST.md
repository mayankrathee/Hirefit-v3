# Authentication Update Deployment Checklist

**Date**: January 2025  
**Version**: 2.1.0 - Email Verification & OAuth Update

---

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] Demo login removed from backend
- [x] Email/password authentication added
- [x] Google OAuth integration added
- [x] Email verification flow implemented
- [x] Frontend updated with new login UI
- [x] Documentation updated

### ✅ Database Schema
- [x] `passwordHash` field exists in User model
- [x] `emailVerified` field exists in User model
- [x] `emailVerificationToken` field exists
- [x] `emailVerificationExpires` field exists
- **No migrations needed** - Schema already supports new features

---

## Environment Variables to Update

### API Environment Variables

Update the following in Azure Container App environment variables:

#### Required Updates

```env
# JWT Configuration (Update)
JWT_EXPIRES_IN=1h                    # Changed from 7d
JWT_REFRESH_EXPIRES_IN=7d            # New variable

# Email Service (Ensure configured)
EMAIL_PROVIDER=azure                  # or 'console' for testing
AZURE_COMMUNICATION_CONNECTION_STRING=<your-connection-string>
AZURE_EMAIL_SENDER_ADDRESS=DoNotReply@hirefit.io
APP_URL=https://hirefit-web-beta.icyfield-0d6da074.eastus.azurecontainerapps.io
WEB_URL=https://hirefit-web-beta.icyfield-0d6da074.eastus.azurecontainerapps.io
```

#### Optional (Google OAuth)

```env
# Google OAuth (Optional - add if you want Google login)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/auth/google/callback
```

#### Microsoft OAuth (Already configured)

```env
# Microsoft OAuth (Keep existing)
AZURE_AD_CLIENT_ID=<existing>
AZURE_AD_CLIENT_SECRET=<existing>
AZURE_AD_TENANT_ID=<existing>
AZURE_AD_REDIRECT_URI=https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/auth/azure-ad/callback
```

### Frontend Environment Variables

Update in GitHub Actions or Container App:

```env
NEXT_PUBLIC_API_URL=https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api
NEXT_PUBLIC_APP_NAME="HireFit Beta"
# Optional OAuth client IDs (for UI display)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<if using Google OAuth>
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=<if using Microsoft OAuth>
```

---

## Deployment Steps

### Step 1: Update API Environment Variables

```bash
# Login to Azure
az login

# Update JWT expiration
az containerapp update \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg \
  --set-env-vars JWT_EXPIRES_IN=1h JWT_REFRESH_EXPIRES_IN=7d

# Update email service (if not already set)
az containerapp update \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg \
  --set-env-vars \
    EMAIL_PROVIDER=azure \
    APP_URL=https://hirefit-web-beta.icyfield-0d6da074.eastus.azurecontainerapps.io \
    WEB_URL=https://hirefit-web-beta.icyfield-0d6da074.eastus.azurecontainerapps.io

# Add Google OAuth (optional)
az containerapp update \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg \
  --set-env-vars \
    GOOGLE_CLIENT_ID=<your-client-id> \
    GOOGLE_CLIENT_SECRET=<your-secret> \
    GOOGLE_REDIRECT_URI=https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/auth/google/callback
```

### Step 2: Deploy API Changes

The API will auto-deploy when you push to `main` branch (if workflow is set up), or manually trigger:

```bash
# Option 1: Push to GitHub (triggers auto-deploy)
git add .
git commit -m "feat: Add email verification and OAuth authentication"
git push origin main

# Option 2: Manual deployment via GitHub Actions
# Go to GitHub → Actions → "Deploy API to Azure Container Apps" → Run workflow
```

### Step 3: Deploy Frontend Changes

```bash
# Push frontend changes
git add apps/web
git commit -m "feat: Update login UI with email/password and OAuth"
git push origin main

# Or manually trigger GitHub Actions
# Go to GitHub → Actions → "Deploy Frontend to Azure Container Apps" → Run workflow
```

### Step 4: Verify Deployment

#### API Health Check

```bash
curl https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/health
```

Expected: `{"status":"ok",...}`

#### Check API Endpoints

```bash
# Check login endpoint exists
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Should return 401 (user doesn't exist) or 400 (validation error)
# NOT 404 (endpoint not found)
```

#### Check Frontend

1. Visit: `https://hirefit-web-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/login`
2. Verify:
   - [ ] Email/password form is visible
   - [ ] Google OAuth button is visible (if configured)
   - [ ] Microsoft OAuth button is visible (if configured)
   - [ ] No demo login button
   - [ ] Sign up link works

---

## Testing Checklist

### Test 1: Email/Password Signup

1. Go to `/signup`
2. Fill form:
   - First Name: "Test"
   - Last Name: "User"
   - Email: your-email@example.com
   - Password: testpassword123
3. Click "Create Free Account"
4. **Expected**: Success page with "Check your email" message
5. Check email inbox for verification email
6. Click verification link
7. **Expected**: Email verified, welcome email sent
8. Go to `/login`
9. Enter email and password
10. **Expected**: Successfully logged in, redirected to dashboard

### Test 2: Email Verification Required

1. Sign up with new email
2. Try to login **before** verifying email
3. **Expected**: Error message "Please verify your email before logging in"

### Test 3: Google OAuth (if configured)

1. Go to `/login`
2. Click "Sign in with Google"
3. **Expected**: Redirected to Google OAuth
4. Authenticate with Google
5. **Expected**: Redirected back, logged in, email auto-verified

### Test 4: Microsoft OAuth (if configured)

1. Go to `/login`
2. Click "Sign in with Microsoft"
3. **Expected**: Redirected to Microsoft OAuth
4. Authenticate with Microsoft
5. **Expected**: Redirected back, logged in, email auto-verified

### Test 5: Password Security

1. Sign up with password
2. Check database (if accessible)
3. **Expected**: `passwordHash` is hashed, not plain text

---

## Rollback Plan

If issues occur, you can rollback:

### Option 1: Rollback Container Image

```bash
# List previous images
az containerapp revision list \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg

# Rollback to previous revision
az containerapp revision restart \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg \
  --revision <previous-revision-name>
```

### Option 2: Revert Code

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Post-Deployment Monitoring

### Check Logs

```bash
# API logs
az containerapp logs show \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg \
  --tail 100 \
  --follow

# Frontend logs
az containerapp logs show \
  --name hirefit-web-beta \
  --resource-group hirefit-ai-rg \
  --tail 100 \
  --follow
```

### Monitor Email Delivery

- Check Azure Communication Services logs
- Verify emails are being sent
- Check spam folder if users report missing emails

### Monitor Authentication Errors

Watch for:
- Email verification failures
- OAuth callback errors
- Password hash errors
- Token generation issues

---

## Known Issues & Solutions

### Issue: "Email verification email not received"

**Solutions**:
- Check `EMAIL_PROVIDER` is set to `azure` (not `console`)
- Verify `AZURE_COMMUNICATION_CONNECTION_STRING` is correct
- Check Azure Communication Services logs
- Verify `APP_URL` is correct (used in verification links)

### Issue: "Google OAuth not working"

**Solutions**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check `GOOGLE_REDIRECT_URI` matches Google Console configuration
- Verify redirect URI is whitelisted in Google Console

### Issue: "Users can't log in after update"

**Solutions**:
- Existing users may need to verify email (if they haven't)
- OAuth users are auto-verified
- Check email verification status in database

---

## Success Criteria

✅ All tests pass  
✅ Email verification emails are sent  
✅ Users can sign up and verify email  
✅ Users can log in with email/password  
✅ OAuth login works (if configured)  
✅ No demo login available  
✅ Frontend shows correct login UI  
✅ Documentation is updated  

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Status**: ⏳ Pending / ✅ Complete / ❌ Failed

