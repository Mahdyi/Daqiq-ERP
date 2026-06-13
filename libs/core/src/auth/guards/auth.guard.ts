import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AUTH_CONFIG } from '../tokens/auth.tokens';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  return router.createUrlTree([config.loginRoute], {
    queryParams: {
      returnUrl: state.url
    }
  });
};
