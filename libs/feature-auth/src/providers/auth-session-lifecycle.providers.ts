import { Provider, inject } from '@angular/core';
import { AUTH_REFRESH_PORT, AuthRefreshPort, AuthRefreshResult } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../data-access/auth-api.service';

class FeatureAuthRefreshPort implements AuthRefreshPort {
  private readonly api = inject(AuthApiService);

  async refresh(refreshToken: string): Promise<AuthRefreshResult> {
    const response = await firstValueFrom(
      this.api.refreshSession({
        refreshToken
      })
    );

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType,
      expiresAt: response.expiresAt
    };
  }
}

export function provideFeatureAuthSessionLifecycle(): Provider[] {
  return [
    FeatureAuthRefreshPort,
    {
      provide: AUTH_REFRESH_PORT,
      useExisting: FeatureAuthRefreshPort
    }
  ];
}
