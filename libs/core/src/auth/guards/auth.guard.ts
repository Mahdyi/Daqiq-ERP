import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AUTH_CONFIG } from '../tokens/auth.tokens';
import { AuthRefreshService } from '../services/auth-refresh.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const refreshService = inject(AuthRefreshService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);
  authService.clearExpiredSession();

  if (authService.isAuthenticated()) {
    return true;
  }

  if (state.url !== '/auth/login' && authService.hasRefreshToken()) {
    const refreshed = await refreshService.refreshIfNeeded();

    if (refreshed && authService.isAuthenticated()) {
      return true;
    }
  }

  return router.createUrlTree([config.loginRoute], {
    queryParams: {
      returnUrl: state.url
    }
  });
};
