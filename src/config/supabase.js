const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.service_role;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
  bucketName: process.env.SUPABASE_STORAGE_BUCKET || 'phd-tracking-docs',
};
