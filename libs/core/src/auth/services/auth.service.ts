import { Injectable, computed, inject, signal } from '@angular/core';

import {
  AuthSession,
  AuthState,
  AuthStatus,
  AuthToken
} from '../models/auth-state.model';
import { PermissionCode, RoleCode } from '../models/role.model';
import { User } from '../models/user.model';
import { AUTH_TOKEN_STORAGE } from '../tokens/auth.tokens';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenStorage = inject(AUTH_TOKEN_STORAGE);
  private readonly storedToken = this.tokenStorage.read();
  private readonly userState = signal<User | null>(null);
  private readonly tokenState = signal<AuthToken | null>(this.storedToken);
  private readonly statusState = signal<AuthStatus>(
    this.storedToken ? 'unknown' : 'unauthenticated'
  );

  readonly user = this.userState.asReadonly();
  readonly token = this.tokenState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly isAuthenticated = computed(
    () => this.status() === 'authenticated' && this.user() !== null && this.token() !== null
  );
  readonly roles = computed(() => this.user()?.roles ?? []);
  readonly permissions = computed<ReadonlySet<PermissionCode>>(() => {
    const user = this.user();
    const permissions = new Set<PermissionCode>(user?.permissions ?? []);

    for (const role of user?.roles ?? []) {
      for (const permission of role.permissions ?? []) {
        permissions.add(permission);
      }
    }

    return permissions;
  });
  readonly state = computed<AuthState>(() => ({
    status: this.status(),
    user: this.user(),
    token: this.token()
  }));

  login(session: AuthSession): void {
    this.tokenStorage.write(session.token);
    this.tokenState.set(session.token);
    this.userState.set(session.user);
    this.statusState.set('authenticated');
  }

  logout(): void {
    this.tokenStorage.remove();
    this.userState.set(null);
    this.tokenState.set(null);
    this.statusState.set('unauthenticated');
  }

  setUser(user: User | null): void {
    this.userState.set(user);
    this.synchronizeStatus();
  }

  setToken(token: AuthToken | null): void {
    if (token) {
      this.tokenStorage.write(token);
    } else {
      this.tokenStorage.remove();
    }

    this.tokenState.set(token);
    this.synchronizeStatus();
  }

  hasRole(role: RoleCode): boolean {
    return this.roles().some((userRole) => userRole.code === role);
  }

  hasAnyRole(roles: readonly RoleCode[]): boolean {
    return roles.length === 0 || roles.some((role) => this.hasRole(role));
  }

  hasPermission(permission: PermissionCode): boolean {
    return this.permissions().has(permission);
  }

  hasAnyPermission(permissions: readonly PermissionCode[]): boolean {
    return (
      permissions.length === 0 ||
      permissions.some((permission) => this.hasPermission(permission))
    );
  }

  private synchronizeStatus(): void {
    if (this.user() && this.token()) {
      this.statusState.set('authenticated');
      return;
    }

    this.statusState.set(this.token() ? 'unknown' : 'unauthenticated');
  }
}
