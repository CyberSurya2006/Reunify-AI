import { createClient } from '@supabase/supabase-js';

// Setup instructions:
// 1. Create a .env file or .env.local file in your project root.
// 2. Add the following keys:
//    VITE_SUPABASE_URL=your_supabase_project_url
//    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

// Use a safe access pattern for import.meta.env
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock mode is completely disabled.
export const isMockMode = false;
