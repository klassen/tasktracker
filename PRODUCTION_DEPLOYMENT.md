# Production Deployment Guide for Task Exclusion Feature

This guide explains how to deploy the task exclusion feature to production on Vercel, which includes a database schema change.

## ⚠️ Important: Database Migration Required

This feature adds a `status` field to the `TaskCompletion` table. You MUST run the database migration on production before deploying the code changes.

## Deployment Steps

### Step 1: Commit and Push Changes

```bash
git add .
git commit -m "Add task exclusion status feature"
git push origin main
```

### Step 2: Run Migration on Production Database

You have **two options** for running the migration on production:

#### Option A: Using Prisma Migrate Deploy (Recommended)

1. **Set your production database URL** as an environment variable locally:
   ```bash
   $env:DATABASE_URL="your-production-postgres-connection-string"
   ```

2. **Run the migration** against production:
   ```bash
   npx prisma migrate deploy
   ```

   This will apply any pending migrations (including the new `20260205161352_add_task_completion_status` migration) to your production database.

3. **Unset the environment variable** (optional, for security):
   ```bash
   Remove-Item Env:\DATABASE_URL
   ```

#### Option B: Manual SQL Execution

If you prefer to run the migration SQL manually:

1. Open the migration file: `prisma/migrations/20260205161352_add_task_completion_status/migration.sql`

2. Copy the SQL content

3. Connect to your production database (via Vercel Postgres dashboard, pgAdmin, or psql)

4. Execute the SQL:
   ```sql
   -- AlterTable
   ALTER TABLE "TaskCompletion" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'completed';
   ```

### Step 3: Deploy to Vercel

Once the migration is complete, Vercel will automatically deploy your changes:

1. **Vercel watches your GitHub repository** - when you pushed to `main`, it triggered a build
2. **Wait for the build to complete** - check the Vercel dashboard
3. **Verify the deployment** - visit your production URL

### Step 4: Verify in Production

1. Log in to your production app
2. Switch to admin mode
3. Click on a task
4. Verify the date picker appears with:
   - ✓ Mark Completed button (green)
   - ⊘ Mark Excluded button (orange)
   - Status indicators in the quick-select list

## What Changed

### Database Schema
- Added `status` column to `TaskCompletion` table
- Default value: `'completed'`
- Possible values: `'completed'` or `'excluded'`

### Features Added
- Admin users can mark tasks as "excluded" (not completed due to external factors)
- Visual distinction:
  - Green background = Completed
  - Orange background = Excluded
- Completion stats now show:
  - Completed count (🔥 X/7 days)
  - Excluded count (⊘ X excluded) - only if > 0

### Backward Compatibility
- All existing completions default to `'completed'` status
- Non-admin mode behavior unchanged
- API accepts optional `status` parameter (defaults to `'completed'`)

## Rollback Procedure

If you need to rollback:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database rollback** (if needed):
   ```sql
   ALTER TABLE "TaskCompletion" DROP COLUMN "status";
   ```

   ⚠️ **Warning:** This will delete all exclusion data!

## Troubleshooting

### Build Fails on Vercel
- Check Vercel build logs for errors
- Ensure `DATABASE_URL` environment variable is set in Vercel
- Verify migration was applied successfully

### Database Connection Errors
- Confirm production database URL is correct
- Check that your IP is allowed in database firewall rules
- Verify database credentials are valid

### Migration Already Applied Error
- This is safe - it means the migration already ran
- Continue with the deployment

## Environment Variables

Ensure these are set in Vercel:
- `DATABASE_URL` - PostgreSQL connection string
- Any other app-specific environment variables

## Post-Deployment Checklist

- [ ] Migration applied successfully to production database
- [ ] Vercel build completed without errors
- [ ] Production app loads correctly
- [ ] Admin mode shows new date picker with status options
- [ ] Can mark tasks as completed
- [ ] Can mark tasks as excluded
- [ ] Visual indicators display correctly (green/orange)
- [ ] Completion stats show correctly
- [ ] Non-admin mode still works as before

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check production database logs
3. Verify environment variables are set correctly
4. Test in development first with production database (carefully!)
