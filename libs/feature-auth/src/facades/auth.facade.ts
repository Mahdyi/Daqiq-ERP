import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@daqiq/core';
import { LoadingService, NotificationService } from '@daqiq/ui';

import { AuthApiService } from '../data-access/auth-api.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { mapLoginResponseToAuthSession } from '../mappers/auth-session.mapper';
import { LoginError } from '../models/login-error.model';
import { LoginFormValue, LOGIN_LABELS } from '../models/login-form-value.model';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private readonly api = inject(AuthApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingService = inject(LoadingService);
  private readonly notifications = inject(NotificationService);

  private readonly loadingState = signal(false);
  private readonly errorState = signal<LoginError | null>(null);

  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly errorMessage = computed(() => this.error()?.message ?? null);
  readonly isAuthenticated = this.auth.isAuthenticated;

  async login(value: LoginFormValue, returnUrl: string | null): Promise<void> {
    if (this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    const loadingHandle = this.loadingService.begin();

    try {
      const response = await this.api.login(this.toLoginRequestDto(value));
      this.auth.login(mapLoginResponseToAuthSession(response));
      this.notifications.success(
        'ورود موفق',
        'با موفقیت وارد سامانه شدید.'
      );
      await this.redirectAfterLogin(returnUrl);
    } catch (error: unknown) {
      this.errorState.set({
        message: error instanceof Error ? error.message : LOGIN_LABELS.invalidCredentials
      });
    } finally {
      loadingHandle.close();
      this.loadingState.set(false);
    }
  }

  logout(): void {
    this.errorState.set(null);
    this.auth.logout();
  }

  async redirectAfterLogin(returnUrl: string | null): Promise<void> {
    await this.router.navigateByUrl(this.getSafeReturnUrl(returnUrl));
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private toLoginRequestDto(value: LoginFormValue): LoginRequestDto {
    return {
      email: value.email.trim().toLowerCase(),
      password: value.password
    };
  }

  private getSafeReturnUrl(returnUrl: string | null): string {
    if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
      return '/dashboard';
    }

    if (returnUrl.startsWith('/auth')) {
      return '/dashboard';
    }

    return returnUrl;
  }
}
