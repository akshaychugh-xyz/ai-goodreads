require('dotenv').config();

// Database switcher - set USE_SUPABASE=true in .env to use Supabase
const useSupabase = process.env.USE_SUPABASE === 'true';

let database;

try {
  if (useSupabase) {
    console.log('Using Supabase database');
    database = require('./supabase');
  } else {
    console.log('Using PostgreSQL database');
    database = require('./database');
  }
} catch (error) {
  console.error('Error loading database module:', error);
  console.error('USE_SUPABASE:', process.env.USE_SUPABASE);
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  throw error;
}

module.exports = database; 