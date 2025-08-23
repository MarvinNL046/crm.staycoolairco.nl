# Fixing Google OAuth Redirect URI Mismatch

## The Problem
Google OAuth error: `Error 400: redirect_uri_mismatch`

This happens when the redirect URL your app uses doesn't match any of the authorized redirect URIs in Google Cloud Console.

## Solution

### 1. Find Your Actual Redirect URLs

When using Supabase Auth, there are typically two redirect flows:

1. **Local Development**: 
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3001/auth/callback` (if port 3000 is busy)

2. **Supabase Hosted Auth**:
   - `https://bdrbfgqgktiuvmynksbe.supabase.co/auth/v1/callback`

### 2. Add ALL Redirect URIs to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In the **Authorized redirect URIs** section, add ALL of these:

```
https://bdrbfgqgktiuvmynksbe.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3001/auth/callback
https://your-production-domain.com/auth/callback
```

5. Click **Save** and wait a few minutes for changes to propagate

### 3. Understanding the OAuth Flow

When using Supabase Auth with Google OAuth:

1. User clicks "Login with Google"
2. Supabase redirects to Google with a redirect_uri
3. Google validates the redirect_uri against your allowed URIs
4. After user consents, Google redirects back to the redirect_uri
5. Supabase handles the OAuth callback and then redirects to YOUR app

### 4. Common Issues and Solutions

**Issue**: Still getting redirect_uri_mismatch after adding URLs
- **Solution**: Make sure there are no trailing slashes or typos
- **Solution**: Wait 5-10 minutes for Google to propagate changes

**Issue**: Works locally but not in production
- **Solution**: Add your production domain to authorized redirect URIs
- **Solution**: Ensure your production app uses HTTPS

**Issue**: Multiple redirect URIs needed
- **Solution**: Add all possible variations (with/without www, different ports)

### 5. Testing the Fix

1. Clear your browser cache and cookies
2. Try logging in again with Google
3. Check the browser console for any errors
4. Verify the redirect URL in the OAuth request matches one in Google Console

### 6. For Production

When deploying to production, make sure to:
1. Add your production domain to Google Cloud Console
2. Update your Supabase project's Site URL in Authentication settings
3. Ensure all redirect URLs use HTTPS in production