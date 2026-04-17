import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase client configuration.
 * WHAT IT DOES: Initializes and exports a client that allows the application to communicate with the Supabase backend (database, auth, storage).
 * ANALOGY: A universal remote control that is programmed to talk to your specific TV and sound system.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log values for debugging (be careful with keys in production, but helpful for dev)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Add a check to prevent the SDK from throwing an unhandled error
if (!supabaseUrl || !supabaseAnonKey) {
  // We throw a descriptive error to help the user identify the issue immediately
  throw new Error('Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

