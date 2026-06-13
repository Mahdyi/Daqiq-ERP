import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RoleCode } from '../models/role.model';
import { AuthService } from '../services/auth.service';
import { AUTH_CONFIG } from '../tokens/auth.tokens';

export const roleGuard: CanActivateFn = (route, state) => {
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

  const requiredRoles = readRequiredRoles(route.data['roles']);

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  return router.createUrlTree([config.forbiddenRoute], {
    queryParams: {
      returnUrl: state.url
    }
  });
};

function readRequiredRoles(value: unknown): readonly RoleCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((role): role is RoleCode => typeof role === 'string');
}
