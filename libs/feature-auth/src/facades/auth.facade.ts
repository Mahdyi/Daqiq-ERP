import { Injectable, signal } from '@angular/core';
import { AuthService, AuthSession } from '@daqiq/core';

import { AuthApiService } from '../data-access/auth.api.service';
import { LoginRequest, LoginResponse } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private loading = signal(false);
  private error = signal<string | null>(null);

  constructor(
    private api: AuthApiService,
    private auth: AuthService
  ) {}

  isLoading = this.loading.asReadonly();
  errorState = this.error.asReadonly();

  async login(req: LoginRequest): Promise<LoginResponse> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.api.login(req);
      this.auth.login(this.toAuthSession(result));
      this.loading.set(false);
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred during login';
      this.error.set(message);
      this.loading.set(false);
      throw error;
    }
  }

  logout(): void {
    this.error.set(null);
    this.auth.logout();
  }

  private toAuthSession(result: LoginResponse): AuthSession {
    return {
      user: {
        id: String(result.user.id),
        username: result.user.email,
        displayName: result.user.name,
        email: result.user.email,
        roles: result.user.roles.map((code) => ({ code, name: code }))
      },
      token: {
        accessToken: result.token
      }
    };
  }
}
