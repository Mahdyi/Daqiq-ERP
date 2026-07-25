import { Injectable, inject } from '@angular/core';

import { AuthToken } from '../models/auth-state.model';
import { AUTH_REFRESH_PORT } from '../ports/auth-refresh.token';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRefreshService {
  private readonly auth = inject(AuthService);
  private readonly refreshPort = inject(AUTH_REFRESH_PORT);
  private inFlightRefresh: Promise<boolean> | null = null;

  refreshIfNeeded(): Promise<boolean> {
    const token = this.auth.token();

    if (!token) {
      return Promise.resolve(false);
    }

    if (!this.auth.isTokenExpired(token)) {
      return Promise.resolve(true);
    }

    return this.forceRefresh();
  }

  forceRefresh(): Promise<boolean> {
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    this.inFlightRefresh = this.performRefresh().finally(() => {
      this.inFlightRefresh = null;
    });

    return this.inFlightRefresh;
  }

  private async performRefresh(): Promise<boolean> {
    const refreshToken = this.auth.token()?.refreshToken?.trim();

    if (!refreshToken || !this.refreshPort) {
      this.auth.logout();
      return false;
    }

    try {
      const result = await this.refreshPort.refresh(refreshToken);
      const token: AuthToken = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenType: result.tokenType,
        expiresAt: result.expiresAt
      };

      return this.auth.updateToken(token);
    } catch {
      this.auth.logout();
      return false;
    }
  }
}
