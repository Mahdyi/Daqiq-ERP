export type ThemeMode = 'light' | 'dark';

export type ThemePreference = ThemeMode | 'system';

export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';

export interface ThemePalette {
  readonly name: string;
  readonly primaryColor: string;
  readonly primaryContrastColor: string;
}

export interface ThemeConfig {
  readonly defaultPreference: ThemePreference;
  readonly availablePreferences: readonly ThemePreference[];
  readonly density: ThemeDensity;
  readonly palette: ThemePalette;
}
