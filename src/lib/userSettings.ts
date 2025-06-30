export const loadUserSettings = async (userId: string) => {
  if (!userId || userId === 'dev-mode-user') {
    console.warn('🛠 Dev mode or invalid user — skipping settings load.');
    return null;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single(); // ← make sure you're using `.single()` now

  console.log("📦 Fetched settings:", { data, error });

  if (error) {
    console.error('❌ Supabase error:', error);
    return null;
  }

  return data;
};
