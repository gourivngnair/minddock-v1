import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  // In development: remind the developer to create .env.local
  // In production: this should never happen if env vars are set on Vercel
  console.error(
    '[MindDock] Missing Supabase credentials.\n' +
    'Copy .env.local.example → .env.local and fill in your project URL and anon key.'
  );
}

// Create client with fallback empty strings so the module doesn't throw.
// Auth calls will fail gracefully and show the login screen.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder-key'
);
