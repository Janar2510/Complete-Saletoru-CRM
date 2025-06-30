import { supabase } from './supabase.ts';

export const loadUserSettings = async (userId: string) => {
  if (!userId || userId === 'dev-mode-user') {
    console.warn('🛠 Dev mode or invalid user — skipping settings load.');
    return null;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single(); // Ensure single row

  console.log("📦 Fetched settings:", { data, error });

  if (error) {
    console.error('❌ Supabase error:', error);
    return null;
  }

  return data;
};

export const saveUserSettings = async (userId: string, settings: any) => {
  if (!userId || userId === 'dev-mode-user') return;

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings });

  if (error) {
    console.error('Failed to save user settings:', error);
    throw error;
  }
};
