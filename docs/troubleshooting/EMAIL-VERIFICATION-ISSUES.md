# Email Verification Troubleshooting Guide

## Issue: Verification Email Not Received

If users are not receiving verification emails after signup, follow these steps to diagnose and fix the issue.

---

## Quick Diagnosis Steps

### 1. Check Email Provider Configuration

The email service uses one of two providers:
- **Console Provider** (default): Logs emails to console, does NOT send actual emails
- **Azure Provider**: Sends real emails via Azure Communication Services

**Check the environment variable:**
```bash
# In Azure Container Apps, check the environment variable
EMAIL_PROVIDER=console  # ❌ This won't send emails
EMAIL_PROVIDER=azure    # ✅ This will send emails
```

### 2. Check Application Logs

Look for these log messages in the API logs:

**If email was sent successfully:**
```
[TenantsService] Verification email sent successfully to user@example.com (Message ID: ...)
```

**If email failed:**
```
[TenantsService] Failed to send verification email to user@example.com: <error message>
[EmailService] Email provider returned failure for user@example.com: <error>
```

**If using console provider:**
```
[ConsoleEmailProvider] ═══════════════════════════════════════════════════════
[ConsoleEmailProvider] 📧 EMAIL (Console Provider - Not Actually Sent)
[ConsoleEmailProvider] To: user@example.com
[ConsoleEmailProvider] Subject: Verify your email - HireFit
```

### 3. Check Azure Communication Services Configuration

If using `EMAIL_PROVIDER=azure`, verify:

1. **Connection String is set:**
   ```bash
   AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...
   ```

2. **Sender address is configured:**
   ```bash
   AZURE_EMAIL_SENDER_ADDRESS=DoNotReply@your-domain.com
   ```

3. **Domain is verified in Azure:**
   - Go to Azure Portal → Communication Services
   - Check that your domain is verified
   - Ensure the sender address matches a verified domain

### 4. Check WEB_URL Configuration

The verification link uses the `WEB_URL` environment variable:

```bash
WEB_URL=https://your-frontend-domain.com
```

**Common issues:**
- `WEB_URL` not set → defaults to `http://localhost:3002` (wrong for production)
- `WEB_URL` set incorrectly → verification links won't work

---

## Fixing the Issue

### Option 1: Configure Azure Communication Services (Production)

1. **Create Azure Communication Services resource:**
   ```bash
   az communication create \
     --name hirefit-email \
     --resource-group hirefit-ai-rg \
     --data-location UnitedStates
   ```

2. **Get connection string:**
   ```bash
   az communication list-key \
     --name hirefit-email \
     --resource-group hirefit-ai-rg
   ```

3. **Verify domain:**
   - Go to Azure Portal → Communication Services → Domains
   - Add and verify your domain
   - Add DNS records as instructed

4. **Update Container App environment variables:**
   ```bash
   az containerapp update \
     --name hirefit-api-beta \
     --resource-group hirefit-ai-rg \
     --set-env-vars \
       EMAIL_PROVIDER=azure \
       AZURE_COMMUNICATION_CONNECTION_STRING="<connection-string>" \
       AZURE_EMAIL_SENDER_ADDRESS="DoNotReply@your-domain.com" \
       WEB_URL="https://your-frontend-domain.com"
   ```

### Option 2: Use Console Provider for Testing (Development Only)

For local development or testing, you can use the console provider to see emails in logs:

```bash
EMAIL_PROVIDER=console
```

**Note:** This will NOT send actual emails. Check the application logs to see the email content.

---

## Testing Email Configuration

### 1. Check Email Health (if endpoint exists)

```bash
curl https://your-api-domain.com/api/email/health
```

### 2. Test Signup Flow

1. Create a new account with a test email
2. Check application logs immediately after signup
3. Look for email-related log messages
4. If using console provider, check logs for email content

### 3. Verify Environment Variables

In Azure Container Apps:

```bash
az containerapp show \
  --name hirefit-api-beta \
  --resource-group hirefit-ai-rg \
  --query "properties.template.containers[0].env"
```

---

## Common Error Messages

### "Azure Communication Services connection string not configured"
- **Fix:** Set `AZURE_COMMUNICATION_CONNECTION_STRING` environment variable

### "Email service not configured"
- **Fix:** Set `EMAIL_PROVIDER=azure` and configure connection string

### "Send failed with status: ..."
- **Fix:** Check Azure Communication Services status and domain verification

### "Failed to initialize Azure Email client"
- **Fix:** Ensure `@azure/communication-email` package is installed

---

## Manual Email Verification

If a user didn't receive the verification email, you can:

1. **Resend verification email** (if endpoint exists):
   ```bash
   POST /api/onboarding/resend-verification-email
   ```

2. **Manually verify email** (admin only):
   - Update user in database: `emailVerified = true`
   - Or use Prisma Studio to update the user record

---

## Production Checklist

- [ ] `EMAIL_PROVIDER=azure` is set
- [ ] `AZURE_COMMUNICATION_CONNECTION_STRING` is configured
- [ ] `AZURE_EMAIL_SENDER_ADDRESS` matches verified domain
- [ ] `WEB_URL` is set to production frontend URL
- [ ] Domain is verified in Azure Communication Services
- [ ] DNS records are correctly configured
- [ ] Test email was sent and received successfully

---

## Additional Resources

- [Azure Communication Services Documentation](https://learn.microsoft.com/en-us/azure/communication-services/)
- [Email Domain Verification Guide](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/add-azure-managed-domains)

