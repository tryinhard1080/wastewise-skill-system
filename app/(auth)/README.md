# Authentication Routes

This directory contains all authentication-related pages and API routes for WasteWise.

## Routes

### Pages (UI)

| Route              | File                       | Purpose                                 |
| ------------------ | -------------------------- | --------------------------------------- |
| `/login`           | `login/page.tsx`           | User login with email/password or OAuth |
| `/signup`          | `signup/page.tsx`          | New user registration                   |
| `/forgot-password` | `forgot-password/page.tsx` | Request password reset link             |
| `/reset-password`  | `reset-password/page.tsx`  | Set new password after reset            |

### API Routes (Server)

| Route            | File                | Purpose                                       |
| ---------------- | ------------------- | --------------------------------------------- |
| `/auth/callback` | `callback/route.ts` | OAuth callback handler and email confirmation |

## Authentication Flows

### 1. Email/Password Signup

```
User → /signup → Enter details → Submit
  ↓
Supabase sends confirmation email
  ↓
User clicks link → /auth/callback?code=xxx
  ↓
Session established → /dashboard
```

### 2. OAuth Login (Google, GitHub)

```
User → /login → Click OAuth button → Provider auth
  ↓
Provider redirects → /auth/callback?code=xxx
  ↓
Session established → /dashboard
```

### 3. Password Reset

```
User → /forgot-password → Enter email → Submit
  ↓
Supabase sends reset email
  ↓
User clicks link → /reset-password?code=xxx
  ↓
Enter new password → Submit → /login
```

## Key Implementation Details

### OAuth Callback (`callback/route.ts`)

**Handles**:

- OAuth provider redirects (Google, GitHub)
- Email confirmation links
- Session establishment via code exchange

**Flow**:

1. Extract `code` from URL params
2. Call `supabase.auth.exchangeCodeForSession(code)`
3. Redirect to `/dashboard` on success
4. Redirect to `/login?error=...` on failure

**Error Handling**:

- Missing code
- Invalid/expired code
- OAuth provider errors
- Session establishment failures

### Password Reset (`reset-password/page.tsx`)

**Features**:

- Token validation on mount
- Password strength validation (same as signup)
- Success state with auto-redirect
- Error state for invalid/expired tokens

**Validation Rules**:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Password and confirm password must match

**States**:

1. **Loading**: Checking token validity
2. **Form**: Valid token, show password fields
3. **Success**: Password updated, redirecting
4. **Error**: Invalid/expired token, show error message

## Security Considerations

### Password Requirements

All password fields enforce the following rules:

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

These are validated both client-side (zod) and server-side (Supabase).

### Token Expiration

- **Email confirmation**: 24 hours
- **Password reset**: 1 hour
- **OAuth codes**: 10 minutes

### Redirect Safety

All redirects use `requestUrl.origin` to prevent open redirect vulnerabilities:

```typescript
// Safe redirect
return NextResponse.redirect(`${requestUrl.origin}/dashboard`);

// Unsafe (DON'T DO THIS)
return NextResponse.redirect(request.headers.get("referer"));
```

### Error Messages

Error messages are intentionally vague for security:

- Don't reveal if email exists in system
- Don't expose internal error details
- Log detailed errors server-side only

## Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing Checklist

- [ ] Email signup → confirmation email → activate → login
- [ ] OAuth signup (Google) → authorize → redirect → dashboard
- [ ] OAuth signup (GitHub) → authorize → redirect → dashboard
- [ ] Password reset request → email → reset → login
- [ ] Invalid reset token → error state
- [ ] Expired reset token → error state
- [ ] Password validation (too short, no uppercase, etc.)
- [ ] Password mismatch error
- [ ] OAuth error handling (user cancels)
- [ ] Invalid callback code handling

## Common Issues & Solutions

### Issue: "No authentication code received"

**Cause**: OAuth provider didn't return a code (user cancelled or provider error)

**Solution**: User should try logging in again

### Issue: "Failed to establish session"

**Cause**: Code is invalid, expired, or already used

**Solution**:

- Check Supabase project settings
- Verify redirect URLs are configured correctly
- Ensure code hasn't been used already (codes are single-use)

### Issue: Password reset link doesn't work

**Cause**: Token expired (1 hour limit)

**Solution**: Request a new password reset link

### Issue: Email confirmation link doesn't work

**Cause**: Token expired (24 hour limit)

**Solution**: Request a new confirmation email via Supabase dashboard or re-signup

## Future Enhancements

- [ ] Add 2FA support
- [ ] Add magic link authentication
- [ ] Add social login providers (LinkedIn, Microsoft)
- [ ] Add account recovery options
- [ ] Add password strength meter
- [ ] Add "Remember me" functionality
- [ ] Add rate limiting for auth attempts
- [ ] Add CAPTCHA for signup/login
