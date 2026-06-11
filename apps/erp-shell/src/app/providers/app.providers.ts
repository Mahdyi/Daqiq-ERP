import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AppConfig, provideDaqiqCore } from '@daqiq/core';

export const ERP_APP_CONFIG: AppConfig = {
  apiBaseUrl: '/api',
  appName: 'Daqiq ERP',
  appVersion: '0.0.0',
  defaultLocale: 'fa-IR',
  defaultDirection: 'rtl',
  production: false
};

export function provideErpShellProviders(): EnvironmentProviders {
  return makeEnvironmentProviders([provideDaqiqCore(ERP_APP_CONFIG)]);
}
