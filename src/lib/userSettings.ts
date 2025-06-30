import { supabase } from './supabase.ts';

export const loadUserSettings = async (userId: string) => {
  if (!userId || userId === 'dev-mode-user') {
    console.warn('Dev mode or invalid user — skipping settings load.');
    return null;
  }

const { data, error } = await supabase
  .from('user_settings')
  .select('*')
  .eq('user_id', userId)
  .single(); 

  if (error) {
    console.error('Failed to load user settings:', error);
    return null;
  }

  if (!data) {
    const defaultSettings = {
      user_id: userId,
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
    };

    const { error: insertError } = await supabase
      .from('user_settings')
      .insert([defaultSettings]);

    if (insertError) {
      console.error('Failed to insert default settings:', insertError);
      return null;
    }

    return defaultSettings;
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
