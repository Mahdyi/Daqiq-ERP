import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AUTH_CONFIG } from '../tokens/auth.tokens';
import { AuthorizationPolicy } from './authorization.model';
import { AuthorizationService } from './authorization.service';

export const authorizationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree([config.loginRoute], {
      queryParams: {
        returnUrl: state.url
      }
    });
  }

  const authorizationService = inject(AuthorizationService);
  const policy = route.data['authorization'] as AuthorizationPolicy | undefined;

  if (authorizationService.canAccess(policy)) {
    return true;
  }

  if (state.url.split('?')[0] === '/dashboard') {
    return false;
  }

  return router.createUrlTree(['/dashboard']);
};
