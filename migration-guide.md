# Database Migration Guide: From Heroku Postgres to Free Alternatives

## Current Setup Analysis
Your BetterReads app uses:
- **Database**: PostgreSQL with 2 simple tables (`users`, `books`)
- **Data Volume**: Likely very low for a side project
- **Queries**: Basic CRUD operations, no complex joins

## Recommended: Migrate to Supabase

### Why Supabase?
- ✅ **PostgreSQL-based** (minimal code changes)
- ✅ **Generous free tier**: 500MB storage, 2GB bandwidth/month
- ✅ **Built-in auth** (can replace your JWT setup later)
- ✅ **Real-time features** for future enhancements
- ✅ **Easy migration** from Heroku Postgres

### Migration Steps

#### 1. Set up Supabase
```bash
# 1. Go to https://supabase.com
# 2. Create a new project
# 3. Get your project URL and API keys
```

#### 2. Install Dependencies
```bash
cd backend
npm install @supabase/supabase-js
```

#### 3. Update Environment Variables
Add to your `.env` file:
```env
# Add these new variables
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Keep your existing DATABASE_URL as backup
DATABASE_URL=your-heroku-postgres-url
```

#### 4. Create Tables in Supabase
Run these SQL commands in Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
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
  my_review TEXT
);

-- Add unique constraint
ALTER TABLE books 
ADD CONSTRAINT unique_book_per_user UNIQUE (user_id, book_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policies (optional - for now, disable RLS for easier migration)
-- You can enable these later for better security
```

#### 5. Export Data from Heroku
```bash
# Export your current data
heroku pg:backups:capture --app your-app-name
heroku pg:backups:download --app your-app-name

# Or use pg_dump if you have direct access
pg_dump $DATABASE_URL > backup.sql
```

#### 6. Import Data to Supabase
```bash
# Use Supabase CLI or the dashboard to import your data
# Or manually copy small datasets through the Supabase dashboard
```

#### 7. Update Your Code
Replace database imports in your backend files:

```javascript
// OLD: const { pool } = require('./db/database');
// NEW: 
const { pool } = require('./db/database-switcher');
```

#### 8. Test the Migration
```bash
# Test with Supabase
USE_SUPABASE=true npm run dev

# Test with PostgreSQL (fallback)
USE_SUPABASE=false npm run dev
```

#### 9. Deploy
Update your production environment variables and deploy.

## Alternative Options

### Option 2: PlanetScale (MySQL)
- **Free tier**: 1GB storage, 1B reads/month
- **Requires**: Converting PostgreSQL queries to MySQL
- **Best for**: Apps that can handle MySQL differences

### Option 3: Railway
- **Free tier**: $5 credit/month
- **PostgreSQL**: Full compatibility
- **Migration**: Easiest from Heroku

### Option 4: Neon
- **Free tier**: 3GB storage
- **PostgreSQL**: Full compatibility
- **Serverless**: Good for low-usage apps

## Cost Comparison

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **Supabase** | 500MB, 2GB bandwidth | Full-stack apps, auth needed |
| **PlanetScale** | 1GB, 1B reads | High-read apps, MySQL OK |
| **Railway** | $5/month credit | Easy Heroku migration |
| **Neon** | 3GB storage | PostgreSQL apps, serverless |
| **Heroku Postgres** | $5/month minimum | 💸 Not free anymore |

## Migration Checklist

- [ ] Create Supabase project
- [ ] Install `@supabase/supabase-js`
- [ ] Add environment variables
- [ ] Create tables in Supabase
- [ ] Export data from Heroku
- [ ] Import data to Supabase
- [ ] Update database imports
- [ ] Test locally
- [ ] Deploy with new config
- [ ] Monitor for issues
- [ ] Cancel Heroku Postgres addon

## Rollback Plan
Keep your Heroku Postgres connection details and set `USE_SUPABASE=false` if you need to rollback quickly.

## Future Optimizations
Once on Supabase, you can:
- Replace JWT auth with Supabase Auth
- Add real-time features
- Use Supabase Storage for file uploads
- Implement Row Level Security for better data protection 