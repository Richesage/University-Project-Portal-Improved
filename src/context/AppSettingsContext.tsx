import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { IS_MOCK } from '../lib/api';

interface AppSettings {
  appTitle: string;
  logoUrl: string | null;
}

interface AppSettingsContextValue extends AppSettings {
  updateAppTitle: (title: string) => Promise<void>;
  updateAppLogo: (file: File) => Promise<string>;
}

const DEFAULTS: AppSettings = { appTitle: 'UniManage Portal', logoUrl: null };

const AppSettingsContext = createContext<AppSettingsContextValue>({
  ...DEFAULTS,
  updateAppTitle: async () => {},
  updateAppLogo: async () => '',
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    if (IS_MOCK) return;
    supabase.from('app_settings').select('key, value').then(({ data }) => {
      if (!data?.length) return;
      const map: Record<string, string> = {};
      data.forEach(row => { if (row.value != null) map[row.key] = row.value; });
      setSettings({
        appTitle: map.app_title ?? DEFAULTS.appTitle,
        logoUrl: map.logo_url ?? null,
      });
    });
  }, []);

  const updateAppTitle = useCallback(async (title: string) => {
    setSettings(prev => ({ ...prev, appTitle: title || DEFAULTS.appTitle }));
    if (IS_MOCK) return;
    await supabase.from('app_settings').upsert({ key: 'app_title', value: title });
  }, []);

  const updateAppLogo = useCallback(async (file: File): Promise<string> => {
    if (IS_MOCK) {
      const url = URL.createObjectURL(file);
      setSettings(prev => ({ ...prev, logoUrl: url }));
      return url;
    }
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `system/logo.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setSettings(prev => ({ ...prev, logoUrl: url }));
    await supabase.from('app_settings').upsert({ key: 'logo_url', value: url });
    return url;
  }, []);

  return (
    <AppSettingsContext.Provider value={{ ...settings, updateAppTitle, updateAppLogo }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
