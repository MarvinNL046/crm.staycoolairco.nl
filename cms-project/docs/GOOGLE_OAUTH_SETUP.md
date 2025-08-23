# Google OAuth Setup Guide

This guide explains how to configure Google OAuth authentication for the CRM application, including both standard Google Sign-In and Google One Tap.

## Prerequisites

1. A Google Cloud Platform account
2. A Supabase project
3. Access to both Google Cloud Console and Supabase Dashboard

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Create Project" or select an existing project
3. Note your project ID for later use

### 1.2 Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you're building for G Suite only)
3. Fill in the required information:
   - **App name**: StayCool CRM
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **Application home page**: `https://your-domain.com`
   - **Privacy policy**: `https://your-domain.com/privacy`
   - **Terms of service**: `https://your-domain.com/terms`

4. Under **Authorized domains**, add:
   - Your production domain (e.g., `staycoolairco.nl`)
   - Your Supabase project domain: `<project-id>.supabase.co`

5. Add the following **OAuth scopes**:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

6. Save and continue

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application** as the application type
4. Configure the following:

   **Name**: StayCool CRM Web Client

   **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.com
   https://<project-id>.supabase.co
   ```

   **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   https://<project-id>.supabase.co/auth/v1/callback
   ```

5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 2: Supabase Configuration

### 2.1 Configure in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Enable**
4. Enter your credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Copy the **Callback URL** shown (you may need to add this to Google Console)
6. Click **Save**

### 2.2 Local Development Configuration

For local development, add to your `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For Supabase CLI, update `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "your-google-client-id"
secret = "your-google-client-secret"
```

## Step 3: Implementation

### 3.1 Standard Google OAuth Button

The application includes a custom Google sign-in button in the `SignInForm` component:

```typescript
// Uses Supabase OAuth flow
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?next=/crm`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

### 3.2 Google's Pre-built Sign-In Button

To use Google's official sign-in button:

```typescript
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

<GoogleSignInButton
  theme="outline"
  size="large"
  text="signin_with"
  locale="nl"
  redirectTo="/crm"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### 3.3 Google One Tap

To enable Google One Tap on your pages:

```typescript
import { GoogleOneTap } from '@/components/auth/GoogleOneTap'

<GoogleOneTap
  autoSelect={true}
  context="signin"
  redirectTo="/crm"
/>
```

Or use the `AuthLayout` wrapper to enable it site-wide:

```typescript
import { AuthLayout } from '@/components/auth/AuthLayout'

<AuthLayout enableOneTap={true} excludePaths={['/auth', '/crm']}>
  {children}
</AuthLayout>
```

## Step 4: Testing

### 4.1 Local Testing

1. Ensure your `.env.local` has the correct Google Client ID
2. Run `npm run dev`
3. Navigate to `http://localhost:3000/auth/login`
4. Test both sign-in methods:
   - Custom Google button
   - Google's pre-built button (if enabled)
5. Check Google One Tap appears on public pages

### 4.2 Production Testing

1. Deploy your application
2. Ensure all domains are added to Google Console
3. Test OAuth flow with a real Google account
4. Verify redirect URLs work correctly

## Step 5: Advanced Configuration

### 5.1 Accessing Google APIs

To access Google APIs on behalf of users, extract the provider tokens:

```typescript
// In your auth callback or after sign-in
const { data: { session } } = await supabase.auth.getSession()
const providerToken = session?.provider_token
const providerRefreshToken = session?.provider_refresh_token

// Use these tokens with Google API client libraries
```

### 5.2 Custom Branding

To customize the Google consent screen:

1. Go to **OAuth consent screen** in Google Console
2. Click **Edit App**
3. Upload your logo and update branding
4. Submit for verification (required for production)

### 5.3 Security Best Practices

1. **Always use nonce** for Google One Tap and pre-built buttons
2. **Validate redirect URLs** in your callback handler
3. **Use HTTPS** in production
4. **Limit OAuth scopes** to only what you need
5. **Store tokens securely** if accessing Google APIs

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Ensure callback URL in Google Console matches exactly
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **"Google is not defined"**
   - Ensure Google script is loaded before initialization
   - Check for ad blockers blocking Google scripts

3. **One Tap not showing**
   - Check browser console for errors
   - Verify FedCM is enabled (Chrome flags)
   - Ensure user hasn't dismissed it previously

4. **"Invalid client ID"**
   - Verify environment variables are loaded
   - Check for typos in client ID
   - Ensure you're using web client ID, not Android/iOS

### Debug Mode

Enable debug logging:

```typescript
// In GoogleOneTap component
console.log('One Tap prompt notification:', {
  displayed: notification.isDisplayed?.(),
  notDisplayedReason: notification.getNotDisplayedReason?.(),
})
```

## Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google One Tap Documentation](https://developers.google.com/identity/gsi/web/guides/display-google-one-tap)