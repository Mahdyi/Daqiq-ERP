export type AppDirection = 'rtl' | 'ltr';

export type AppLocale = 'fa-IR' | 'en-US';

export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly appName: string;
  readonly appVersion?: string;
  readonly defaultLocale: AppLocale;
  readonly defaultDirection: AppDirection;
  readonly production: boolean;
}
