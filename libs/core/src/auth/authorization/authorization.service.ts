import { Injectable, computed, inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { AppPermission, AppRole, AuthorizationPolicy } from './authorization.model';
import {
  normalizePermissions,
  normalizeRoles,
  resolvePermissionsForRoles
} from './authorization.util';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly authService = inject(AuthService);

  readonly roles = computed<readonly AppRole[]>(() => {
    const userRoles = this.authService.user()?.roles.map((role) => role.code) ?? [];
    return normalizeRoles(userRoles);
  });

  readonly permissions = computed<readonly AppPermission[]>(() => {
    const rolePermissions = resolvePermissionsForRoles(this.roles());
    const userPermissions = normalizePermissions(this.authService.user()?.permissions ?? []);

    return [...new Set([...rolePermissions, ...userPermissions])];
  });

  readonly isAdmin = computed(() => this.hasRole('admin'));

  hasRole(role: AppRole): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: readonly AppRole[]): boolean {
    return roles.length === 0 || roles.some((role) => this.hasRole(role));
  }

  hasPermission(permission: AppPermission): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: readonly AppPermission[]): boolean {
    return (
      permissions.length === 0 ||
      permissions.some((permission) => this.hasPermission(permission))
    );
  }

  hasAllPermissions(permissions: readonly AppPermission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  canAccess(policy: AuthorizationPolicy | null | undefined): boolean {
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    if (!policy) {
      return true;
    }

    if (policy.roles && !this.hasAnyRole(policy.roles)) {
      return false;
    }

    if (!policy.permissions || policy.permissions.length === 0) {
      return true;
    }

    return policy.requireAllPermissions === true
      ? this.hasAllPermissions(policy.permissions)
      : this.hasAnyPermission(policy.permissions);
  }
}
