import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here');

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  console.info('Developer Mode is available for testing without Supabase configuration.');
}

// Create Supabase client with proper error handling
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}) : null;

// Enhanced error logging for development
if (localStorage.getItem('devMode') === 'true' && isSupabaseConfigured) {
  console.log('[DEV] Supabase client initialized with URL:', supabaseUrl);
  
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0].toString();
    if (url.includes(supabaseUrl)) {
      console.log(`[DEV] Supabase request: ${url}`);
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          const error = await response.clone().text();
          console.error(`[DEV] Supabase error (${url}):`, error);
        }
        return response;
      } catch (error) {
        console.error(`[DEV] Supabase fetch error (${url}):`, error);
        throw error;
      }
    }
    return originalFetch(...args);
  };
}

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return false;
  }

  try {
    const { data, error } = await supabase.from('deals').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};