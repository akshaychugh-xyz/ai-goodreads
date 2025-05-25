require('dotenv').config();

// Database switcher - set USE_SUPABASE=true in .env to use Supabase
const useSupabase = process.env.USE_SUPABASE === 'true';

let database;

if (useSupabase) {
  console.log('Using Supabase database');
  database = require('./supabase');
} else {
  console.log('Using PostgreSQL database');
  database = require('./database');
}

module.exports = database; 