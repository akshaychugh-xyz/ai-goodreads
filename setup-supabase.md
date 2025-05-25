# Supabase Setup Guide for BetterReads

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose your organization
5. Fill in:
   - **Name**: `betterreads` (or whatever you prefer)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for setup to complete (~2 minutes)

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) - **Keep this secret!**

## Step 3: Update Your Environment

Create/update your `.env` file in the `backend` folder:

```env
# Enable Supabase
USE_SUPABASE=true

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Keep your existing variables
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-key
NODE_ENV=development

# Keep Heroku DB as backup (optional)
DATABASE_URL=your-heroku-postgres-url
```

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Paste this SQL and click "Run":

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  average_rating REAL,
  number_of_pages INTEGER,
  my_rating REAL,
  date_added DATE,
  date_read DATE,
  exclusive_shelf TEXT,
  title TEXT,
  author TEXT,
  isbn TEXT,
  book_id TEXT,
  my_review TEXT,
  CONSTRAINT unique_book_per_user UNIQUE (user_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_exclusive_shelf ON books(exclusive_shelf);
CREATE INDEX IF NOT EXISTS idx_books_user_shelf ON books(user_id, exclusive_shelf);
```

## Step 5: Test the Connection

Run the test script:

```bash
cd backend
node test-supabase.js
```

You should see:
```
Testing Supabase connection...
1. Testing database initialization...
2. Testing simple query...
✅ Supabase connection test completed successfully!
```

## Step 6: Migrate Your Data (Optional)

If you have existing data in Heroku Postgres:

### Export from Heroku:
```bash
# Create backup
heroku pg:backups:capture --app your-app-name

# Download backup
heroku pg:backups:download --app your-app-name

# Or use pg_dump directly
pg_dump $DATABASE_URL > backup.sql
```

### Import to Supabase:
1. In Supabase dashboard, go to **Database** → **Backups**
2. Click "Restore from backup"
3. Upload your backup file

**OR** for small datasets, manually copy data:

1. Export users: `SELECT * FROM users;`
2. Export books: `SELECT * FROM books;`
3. Insert into Supabase using the dashboard

## Step 7: Test Your App

```bash
cd backend
npm run dev
```

Your app should now use Supabase! Check the console logs for "Using Supabase database".

## Step 8: Deploy

Update your production environment variables:
- Vercel: Add env vars in dashboard
- Heroku: `heroku config:set USE_SUPABASE=true SUPABASE_URL=... etc.`
- Railway: Add in dashboard

## Troubleshooting

### "RPC function not found" errors
- This is normal - the tables will be created manually via SQL Editor

### "Invalid API key" errors
- Double-check your SUPABASE_SERVICE_ROLE_KEY
- Make sure there are no extra spaces/newlines

### "Table doesn't exist" errors
- Run the SQL commands in Step 4 again
- Check the **Database** → **Tables** section in Supabase

### Connection timeouts
- Check your internet connection
- Verify the SUPABASE_URL is correct

## Rollback Plan

If something goes wrong, you can quickly switch back:

```env
USE_SUPABASE=false
```

Your app will use the original Heroku Postgres connection.

## Next Steps

Once everything works:
1. Cancel your Heroku Postgres addon to save money
2. Consider using Supabase Auth instead of JWT
3. Explore Supabase real-time features
4. Set up Row Level Security for better data protection

## Cost Monitoring

Supabase free tier includes:
- 500MB database storage
- 2GB bandwidth per month
- 50MB file uploads
- 500,000 edge function invocations

Monitor usage in **Settings** → **Usage**. 