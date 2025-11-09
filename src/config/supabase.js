require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;

// Database Schema:

// notes
// ----------
// id
// user_id
// title
// content
// created_at
// updated_at
// user_uuid

// users
// -----------
// id
// username
// email
// password
// created_at
// updated_at
