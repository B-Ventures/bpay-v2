# Google OIDC Authentication Setup for AWS Deployment

## 🔧 Required Environment Variables

Set these environment variables in your AWS deployment:

```bash
# Google OIDC Configuration
OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=GOCSPX-your-google-client-secret
OIDC_ISSUER=https://accounts.google.com

# Application Configuration  
BASE_URL=https://your-aws-domain.com
SESSION_SECRET=your-random-session-secret-key

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Stripe Configuration (existing)
STRIPE_SECRET_KEY=sk_live_or_test_your_stripe_key
```

## 🚀 Google Cloud Console Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Google+ API" or "People API"

### Step 2: Configure OAuth 2.0
1. Navigate to **APIs & Services > Credentials**
2. Click **"Create Credentials" > "OAuth 2.0 Client IDs"**
3. Choose **"Web application"**
4. Configure the following:

**Authorized JavaScript origins:**
```
https://your-aws-domain.com
```

**Authorized redirect URIs:**
```
https://your-aws-domain.com/api/callback
```

### Step 3: Get Credentials
After creating the OAuth client, you'll receive:
- **Client ID**: Set as `OIDC_CLIENT_ID`
- **Client Secret**: Set as `OIDC_CLIENT_SECRET`

## 🔄 Changes Made to Authentication Code

### Modified Files:
- `server/replitAuth.ts` - Updated to use Google OIDC instead of Replit Auth
- `server/googleAuth.ts` - Alternative clean implementation (optional)

### Key Changes:
1. **Environment Variables**: Now uses standard OIDC variables instead of Replit-specific ones
2. **Issuer URL**: Changed from `https://replit.com/oidc` to `https://accounts.google.com`
3. **User Claims**: Updated to use Google's claim names (`given_name`, `family_name`, `picture`)
4. **Callback URL**: Simplified to work with single domain instead of multiple Replit domains
5. **Security**: Added proper production/development cookie security settings

## 🧪 Testing Locally

To test locally before AWS deployment:

```bash
# Set these in your local environment
export OIDC_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
export OIDC_CLIENT_SECRET="GOCSPX-your-google-client-secret"
export BASE_URL="http://localhost:5000"
export SESSION_SECRET="your-local-session-secret"

# Add to Google Console authorized redirect URIs:
http://localhost:5000/api/callback
```

## 🔒 Security Notes

1. **Production Settings**: Cookie security automatically adjusts based on `NODE_ENV=production`
2. **HTTPS Required**: Google OIDC requires HTTPS in production
3. **Domain Verification**: Ensure your AWS domain is properly configured in Google Console
4. **Session Storage**: Uses PostgreSQL for session persistence across server restarts

## 🚨 Migration from Replit Auth

**Removed Environment Variables:**
- `REPL_ID` ❌
- `REPLIT_DOMAINS` ❌
- `ISSUER_URL` ❌ (replaced with `OIDC_ISSUER`)

**New Required Variables:**
- `OIDC_CLIENT_ID` ✅
- `OIDC_CLIENT_SECRET` ✅
- `BASE_URL` ✅

## 📝 Deployment Checklist

- [ ] Google Cloud project created
- [ ] OAuth 2.0 client configured with correct redirect URIs
- [ ] Environment variables set in AWS
- [ ] Database accessible from AWS
- [ ] HTTPS configured for production domain
- [ ] Test login flow after deployment

The authentication system is now ready for AWS deployment with Google OIDC!