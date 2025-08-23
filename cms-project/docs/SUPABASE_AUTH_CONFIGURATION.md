# Supabase Auth Configuration Fixes

This document explains how to fix the Auth configuration warnings in Supabase.

## Auth Security Issues

### 1. OTP Long Expiry Warning

**Problem**: The OTP (One-Time Password) expiry is set to more than 1 hour, which is a security risk.

**Fix**: 
1. Go to Supabase Dashboard > Authentication > Settings
2. Under "Email" settings, find "OTP Expiry"
3. Set it to 3600 seconds (1 hour) or less (recommended: 900 seconds / 15 minutes)
4. Click "Save"

### 2. Leaked Password Protection Disabled

**Problem**: Password protection against leaked/compromised passwords is disabled.

**Fix**:
1. Go to Supabase Dashboard > Authentication > Settings
2. Under "Security" settings, find "Password Security"
3. Enable "Leaked Password Protection"
4. This will check passwords against HaveIBeenPwned.org database
5. Click "Save"

## Recommended Auth Configuration

```javascript
// Example configuration for Supabase Auth
const authConfig = {
  // Email settings
  email: {
    otpExpiry: 900, // 15 minutes
    confirmationExpiry: 86400, // 24 hours
    passwordRecoveryExpiry: 3600, // 1 hour
  },
  
  // Security settings
  security: {
    leakedPasswordProtection: true,
    minimumPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true,
  },
  
  // Session settings
  session: {
    expiryMargin: 300, // 5 minutes
    singleSession: false,
  }
};
```

## Additional Security Recommendations

### 1. Enable Multi-Factor Authentication (MFA)
- Go to Authentication > Settings > Multi-Factor Auth
- Enable TOTP (Time-based One-Time Password)

### 2. Configure Password Policy
- Set minimum password length to 12+ characters
- Require mix of uppercase, lowercase, numbers, and special characters
- Enable password history to prevent reuse

### 3. Session Management
- Set appropriate session expiry times
- Enable session refresh
- Configure JWT expiry appropriately

### 4. Rate Limiting
- Enable rate limiting for auth endpoints
- Set appropriate limits for:
  - Sign up attempts
  - Sign in attempts
  - Password reset requests

### 5. Email Templates
- Customize email templates to match your brand
- Ensure emails include security warnings
- Add clear CTAs and expiry information

## Monitoring and Alerts

Set up monitoring for:
- Failed login attempts
- Password reset requests
- New device logins
- Suspicious activity patterns

## Implementation Checklist

- [ ] Set OTP expiry to ≤ 1 hour
- [ ] Enable leaked password protection
- [ ] Configure password policy
- [ ] Enable MFA (optional but recommended)
- [ ] Set up rate limiting
- [ ] Customize email templates
- [ ] Configure session management
- [ ] Set up monitoring and alerts
- [ ] Test all auth flows
- [ ] Document auth configuration

## Testing Auth Configuration

After making changes, test:
1. Sign up flow
2. Sign in flow
3. Password reset flow
4. OTP verification
5. Session expiry and refresh
6. Rate limiting behavior
7. Leaked password detection

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Auth Security Best Practices](https://supabase.com/docs/guides/auth/auth-security)
- [Going to Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod#security)