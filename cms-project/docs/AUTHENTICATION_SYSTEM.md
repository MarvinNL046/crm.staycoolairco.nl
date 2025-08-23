# Authentication System Documentation

## Overview

The CRM application uses Supabase Auth for authentication with support for:
- Email/password authentication
- Google OAuth
- Password reset functionality
- Protected routes
- Session management

## Features Implemented

### 1. Authentication Components

- **SignInForm** (`/src/components/auth/SignInForm.tsx`)
  - Email/password login
  - Google OAuth login
  - Remember next URL after login
  - Dutch language interface

- **SignUpForm** (`/src/components/auth/SignUpForm.tsx`)
  - Email/password registration
  - Password confirmation
  - Email verification flow
  - Google OAuth registration

- **ResetPasswordForm** (`/src/components/auth/ResetPasswordForm.tsx`)
  - Password reset request
  - Email notification for reset link

- **UpdatePasswordForm** (`/src/components/auth/UpdatePasswordForm.tsx`)
  - Set new password after reset
  - Password confirmation
  - Auto-redirect to dashboard

### 2. Authentication Pages

- `/auth/login` - Login page
- `/auth/signup` - Registration page
- `/auth/reset-password` - Password reset request
- `/auth/update-password` - Update password (requires authentication)
- `/auth/auth-code-error` - Error handling page
- `/auth/callback` - OAuth callback handler

### 3. Route Protection

The middleware (`/src/middleware.ts`) protects routes:

**Protected Routes:**
- `/admin/*` - Admin area
- `/crm/*` - CRM dashboard

**Public Routes:**
- `/` - Homepage
- `/auth/*` - Authentication pages (except update-password)

**Behavior:**
- Unauthenticated users are redirected to login
- Login preserves the intended destination
- Authenticated users can't access login/signup pages

### 4. Supabase Configuration

- Client-side: `/src/lib/supabase/client.ts`
- Server-side: `/src/lib/supabase/server.ts`
- Environment variables required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Authentication Flow

### Email/Password Registration
1. User fills signup form
2. Account created in Supabase
3. Verification email sent
4. User clicks verification link
5. Redirected to CRM dashboard

### Email/Password Login
1. User enters credentials
2. Credentials verified by Supabase
3. Session created
4. Redirected to intended page or CRM

### Password Reset
1. User requests reset on `/auth/reset-password`
2. Reset email sent with magic link
3. User clicks link → `/auth/update-password`
4. User sets new password
5. Auto-redirect to CRM dashboard

### Google OAuth
1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. After approval → `/auth/callback`
4. Session created
5. Redirected to CRM dashboard

## Security Features

- Passwords must be at least 6 characters
- Password confirmation on signup/reset
- Secure session management
- PKCE flow for OAuth
- Protected routes via middleware
- Email verification (configurable)

## Email Configuration

For production, configure custom SMTP in Supabase:
- Auth → Settings → Email Templates
- Configure SMTP provider
- Customize email templates

For local development:
- Emails captured by Mailpit
- Run `supabase status` for Mailpit URL

## Error Handling

- Invalid credentials → Error message
- OAuth failures → Redirect to error page
- Session expiry → Redirect to login
- Network errors → User-friendly messages

## Testing Checklist

1. ✅ Email/password signup with verification
2. ✅ Email/password login
3. ✅ Google OAuth login
4. ✅ Password reset flow
5. ✅ Protected route access
6. ✅ Session persistence
7. ✅ Error handling
8. ✅ Redirect after login

## Future Enhancements

- [ ] Multi-factor authentication (MFA)
- [ ] Social logins (GitHub, Microsoft)
- [ ] Remember me functionality
- [ ] Session timeout configuration
- [ ] Account deletion
- [ ] Email change functionality
- [ ] Profile management
- [ ] Role-based access control (RBAC)