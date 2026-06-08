require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env ou Render.');
}

const supabase = createClient(process.env.SUPABASE_URL || 'http://localhost', process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', {
  auth: { persistSession: false }
});

module.exports = supabase;
