# SmartHire - Supabase & Google OAuth Setup Guide

This guide will walk you through setting up Supabase authentication with Google OAuth for the SmartHire application.

## Table of Contents

1. [Supabase Project Setup](#1-supabase-project-setup)
2. [Database Schema Setup](#2-database-schema-setup)
3. [Environment Variables Configuration](#3-environment-variables-configuration)
4. [Google OAuth Setup](#4-google-oauth-setup)
5. [Supabase Auth Configuration](#5-supabase-auth-configuration)
6. [Testing the Integration](#6-testing-the-integration)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Supabase Project Setup

### Step 1.1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up with GitHub or email
3. Verify your email if required

### Step 1.2: Create a New Project

1. Click "New Project" in your dashboard
2. Fill in the project details:
   - **Name**: `smarthire` (or your preferred name)
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose the closest to your users
3. Click "Create new project"
4. Wait for the project to be provisioned (1-2 minutes)

### Step 1.3: Get Your API Keys

1. Go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: (Keep this secret! Only for server-side operations)

---

## 2. Database Schema Setup

### Step 2.1: Run the Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the migration

### Step 2.2: Create the Auth Trigger Function

After running the main migration, you need to create a trigger that automatically creates a profile when a user signs up:

```sql
-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'job_seeker')
  );

  -- Create role-specific profile
  IF COALESCE((new.raw_user_meta_data->>'role')::user_role, 'job_seeker') = 'job_seeker' THEN
    INSERT INTO public.seeker_profiles (id, skills, experience, education, certifications, languages)
    VALUES (new.id, '[]', '[]', '[]', '[]', '[]');
  ELSIF COALESCE((new.raw_user_meta_data->>'role')::user_role, 'job_seeker') = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id, company_name, company_size, industry)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'company_name', 'My Company'),
      'small',
      'technology'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Run this SQL in the SQL Editor after the main migration.

### Step 2.3: Verify Tables

Go to **Table Editor** and verify these tables exist:
- `profiles`
- `seeker_profiles`
- `recruiter_profiles`
- `jobs`
- `applications`
- `saved_jobs`

---

## 3. Environment Variables Configuration

### Step 3.1: Update .env.local

Create or update your `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: FastAPI Backend URL (for AI processing)
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Replace the placeholder values with your actual Supabase credentials.

---

## 4. Google OAuth Setup

### Step 4.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" > "New Project"
3. Name it "SmartHire" (or your preferred name)
4. Click "Create"

### Step 4.2: Enable OAuth APIs

1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API" and enable it
3. Search for "Google Identity" and enable it

### Step 4.3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace organization)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: SmartHire
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
8. Click "Update" then "Save and Continue"
9. Add test users if needed (for development)
10. Click "Save and Continue" then "Back to Dashboard"

### Step 4.4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Name: "SmartHire Web Client"
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://your-production-domain.com` (production)
6. Add **Authorized redirect URIs**:
   - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

---

## 5. Supabase Auth Configuration

### Step 5.1: Enable Google Provider

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Toggle "Enable Sign in with Google"
4. Enter:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click "Save"

### Step 5.2: Configure Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback` (for production)
4. Click "Save"

### Step 5.3: Configure Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the templates for:
   - Confirmation
   - Invite
   - Magic Link
   - Change Email Address
   - Reset Password

---

## 6. Testing the Integration

### Step 6.1: Start the Development Server

```bash
npm run dev
```

### Step 6.2: Test Email/Password Registration

1. Go to `http://localhost:3000/register`
2. Select "Job Seeker" or "Recruiter"
3. Fill in the form and submit
4. Check your email for verification (if email confirmation is enabled)

### Step 6.3: Test Google OAuth

1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Select your Google account
4. You should be redirected to the appropriate dashboard

### Step 6.4: Verify in Supabase

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Verify the user was created
3. Go to **Table Editor** > **profiles**
4. Verify the profile was created with the correct role

---

## 7. Troubleshooting

### Common Issues

#### "Invalid Redirect URI" Error

- Ensure your redirect URI in Google Cloud Console matches exactly:
  `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Check there are no trailing slashes or typos

#### "Profile not created after sign up"

- Verify the trigger function was created correctly
- Check the Supabase logs: **Database** > **Query Performance** or **Logs**
- Ensure RLS policies are correctly set

#### "Access Denied" after login

- Check the middleware is correctly protecting routes
- Verify the user's role in the `profiles` table
- Check browser console for errors

#### Google OAuth not working in production

1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
2. Add production URL to Supabase redirect URLs
3. Update `NEXT_PUBLIC_SITE_URL` in production environment

### Debug Mode

To enable detailed logging, you can temporarily add:

```typescript
// In your Supabase client
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
})
```

### Checking Logs

- **Supabase Logs**: Dashboard > Logs > Auth
- **Browser Console**: Check for any JavaScript errors
- **Network Tab**: Monitor auth requests/responses

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_SITE_URL` to production URL
- [ ] Add production domain to Supabase redirect URLs
- [ ] Add production domain to Google Cloud Console
- [ ] Update OAuth consent screen to "Production" status
- [ ] Enable Row Level Security (RLS) is on for all tables
- [ ] Test all authentication flows
- [ ] Set up proper error monitoring (e.g., Sentry)
- [ ] Configure rate limiting if needed
- [ ] Review and test email templates

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## Support

If you encounter issues:
1. Check the [Supabase Discord](https://discord.supabase.com/)
2. Review [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Check [Next.js Discussions](https://github.com/vercel/next.js/discussions)
