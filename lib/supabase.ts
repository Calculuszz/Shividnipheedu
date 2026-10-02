import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (only use on server).
// Tables have no anon policies, so without this key the API routes can't read or write.
if (typeof window === 'undefined' && !supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing: API routes will not be able to access the database.');
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);
