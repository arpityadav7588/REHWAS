import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase client configuration.
 * WHAT IT DOES: Initializes and exports a client that allows the application to communicate with the Supabase backend (database, auth, storage).
 * ANALOGY: A universal remote control that is programmed to talk to your specific TV and sound system.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
