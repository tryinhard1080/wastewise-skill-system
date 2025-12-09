# Dashboard Setup Instructions

## Issue Fixed

The dashboard was showing a server error because the environment variables weren't being properly loaded by Next.js middleware.

## Changes Made

1. **Updated `next.config.mjs`** - Added explicit environment variable configuration
2. **Updated `.env`** - Added missing environment variable placeholders

## Required Actions

### 1. Add Your Supabase Service Role Key

Open `.env` and replace `your-service-role-key-here` with your actual Supabase service role key:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find it:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `aciygdfdorknchefxoji`
3. Go to Settings → API
4. Copy the `service_role` key (NOT the anon key)

### 2. Add Your Anthropic API Key (Optional, for AI features)

Replace `your-anthropic-api-key-here` with your actual Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Where to get it:**
- Visit: https://console.anthropic.com/settings/keys
- Create a new API key if needed

## Verification

After adding the keys:

1. **Restart the development server:**
   ```bash
   npm run dev
   ```

2. **The dashboard should now load without errors**

3. **Test the authentication:**
   - Visit http://localhost:3000/login
   - Create a new account or sign in
   - Navigate to the dashboard

## Database Status

✅ **Database is connected and ready**
- All tables are created
- Row Level Security (RLS) is enabled
- Migrations have been applied successfully

## Current Environment

```
Supabase URL: https://aciygdfdorknchefxoji.supabase.co
Supabase Anon Key: ✅ Configured
Service Role Key: ⚠️ Needs to be added
Anthropic API Key: ⚠️ Optional, add for AI features
```

## Troubleshooting

If you still see errors after adding the keys:

1. **Clear the Next.js cache:**
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

2. **Verify environment variables are loaded:**
   - Check that `.env` file is in the project root
   - Ensure there are no extra spaces or quotes around values
   - Restart your IDE/terminal if variables aren't being picked up

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for specific error messages
   - Check the Network tab for failed API requests
