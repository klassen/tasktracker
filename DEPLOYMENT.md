# Deployment Guide - Vercel

## Prerequisites
1. GitHub account
2. Vercel account (free tier works)
3. PostgreSQL database (cloud provider)

## Step 1: Set Up Cloud Database

Choose one of these PostgreSQL providers:

### Option A: Vercel Postgres (Recommended - easiest)
1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the `DATABASE_URL` connection string

### Option B: Neon (Generous free tier)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option C: Supabase (Full featured)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection pooling" for better performance)

## Step 2: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the following:

### Framework Preset
- Should auto-detect as "Next.js"

### Build Settings
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

**Leave these as default - they're already correct in package.json**

### Environment Variables (REQUIRED)

Add these in the Vercel dashboard:

#### Required Variables:

1. **DATABASE_URL**
   - Value: Your PostgreSQL connection string from Step 1
   - Example: `postgresql://user:pass@host.region.provider.com:5432/dbname`

2. **ADMIN_PASSWORD**
   - Value: A secure password for admin access
   - Example: `MySecureAdminPass123!`

#### Optional Variables (for Google Calendar):

3. **GOOGLE_CLIENT_ID** (optional)
   - Leave blank to disable calendar features
   - Or add your Google OAuth client ID

4. **GOOGLE_CLIENT_SECRET** (optional)
   - Leave blank to disable calendar features
   - Or add your Google OAuth client secret

5. **GOOGLE_REDIRECT_URI** (optional - auto-detected)
   - Only needed if auto-detection fails
   - Format: `https://your-app.vercel.app/api/calendar/callback`

6. **NEXT_PUBLIC_BASE_URL** (optional - auto-detected)
   - Only needed for custom domains
   - Format: `https://your-app.vercel.app`

## Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)

## Step 5: Run Database Migrations

After first deployment, you need to initialize the database:

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### Option B: Using Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Go to Settings → Environment Variables
3. Add a temporary variable: `RUN_MIGRATIONS=true`
4. Redeploy the app
5. Remove the `RUN_MIGRATIONS` variable after successful deployment

### Option C: Direct Database Access
1. Install `psql` or use a GUI tool like TablePlus
2. Connect to your cloud database
3. Run the migration SQL manually from `prisma/migrations/`

## Step 6: First Login

1. Visit your deployed app: `https://your-app.vercel.app`
2. Login with:
   - Account: `admin`
   - Password: (the ADMIN_PASSWORD you set in environment variables)
3. Create your first tenant account
4. Logout and login as the tenant

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

### Database Connection Error
- Verify DATABASE_URL is correct
- Check if database allows connections from Vercel IPs
- For Vercel Postgres: Make sure database is in the same region

### "Prisma Client not generated" Error
- The `postinstall` script should handle this automatically
- Check that `"postinstall": "prisma generate"` exists in package.json

### Google Calendar Not Working
- Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Update redirect URI in Google Cloud Console to match your Vercel URL
- Format: `https://your-app.vercel.app/api/calendar/callback`

### Database Migrations Not Applied
- See Step 5 for running migrations
- Check Vercel deployment logs for any Prisma errors

## Updating the App

After making changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically deploy the new version.

## Custom Domain (Optional)

1. Go to your project in Vercel
2. Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update GOOGLE_REDIRECT_URI if using calendar features

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| ADMIN_PASSWORD | ✅ Yes | Password for admin account | `SecurePass123!` |
| GOOGLE_CLIENT_ID | ❌ No | Google OAuth client ID | `12345.apps.googleusercontent.com` |
| GOOGLE_CLIENT_SECRET | ❌ No | Google OAuth client secret | `GOCSPX-abc123` |
| GOOGLE_REDIRECT_URI | ❌ No | OAuth callback URL (auto-detected) | `https://app.vercel.app/api/calendar/callback` |
| NEXT_PUBLIC_BASE_URL | ❌ No | Base URL (auto-detected) | `https://your-app.vercel.app` |

## Security Notes

- ✅ Passwords are hashed with bcrypt
- ✅ Multi-tenant data isolation enforced at API level
- ✅ Admin password stored in environment variables
- ⚠️ Always use HTTPS in production (Vercel provides this automatically)
- ⚠️ Keep your ADMIN_PASSWORD secure and don't commit it to git

## Need Help?

Check the Vercel documentation:
- [Deploying Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Postgres Integration](https://vercel.com/docs/storage/vercel-postgres)
