import { InjectionToken } from '@angular/core';

import { ThemeConfig } from './theme.model';

export const THEME_STORAGE_KEY = new InjectionToken<string>('THEME_STORAGE_KEY', {
  providedIn: 'root',
  factory: () => 'daqiq-erp.theme-preference'
});

export const DEFAULT_THEME_CONFIG = new InjectionToken<ThemeConfig>('DEFAULT_THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    defaultPreference: 'system',
    availablePreferences: ['light', 'dark', 'system'],
    density: 'comfortable',
    palette: {
      name: 'Daqiq Default',
      primaryColor: '#2563eb',
      primaryContrastColor: '#ffffff'
    }
  })
});
