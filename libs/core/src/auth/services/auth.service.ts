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
  private readonly storedSession = this.readStoredSession();
  private readonly userState = signal<User | null>(this.storedSession?.user ?? null);
  private readonly tokenState = signal<AuthToken | null>(this.storedSession?.token ?? null);
  private readonly statusState = signal<AuthStatus>(
    this.storedSession ? 'authenticated' : 'unauthenticated'
  );

  readonly user = this.userState.asReadonly();
  readonly token = this.tokenState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly hasValidToken = computed(() => {
    const token = this.token();
    return token !== null && !this.isTokenExpired(token);
  });
  readonly isAuthenticated = computed(
    () => this.status() === 'authenticated' && this.user() !== null && this.hasValidToken()
  );
  readonly hasRefreshToken = computed(() => Boolean(this.token()?.refreshToken?.trim()));
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
    if (this.isTokenExpired(session.token)) {
      this.logout();
      return;
    }

    this.tokenStorage.write(session);
    this.tokenState.set(session.token);
    this.userState.set(session.user);
    this.statusState.set('authenticated');
  }

  updateToken(token: AuthToken): boolean {
    const user = this.user();

    if (!user || this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    this.tokenStorage.write({
      user,
      token
    });
    this.tokenState.set(token);
    this.statusState.set('authenticated');
    return true;
  }

  logout(): void {
    this.tokenStorage.remove();
    this.userState.set(null);
    this.tokenState.set(null);
    this.statusState.set('unauthenticated');
  }

  setUser(user: User | null): void {
    this.userState.set(user);
    this.persistCurrentSession();
    this.synchronizeStatus();
  }

  setToken(token: AuthToken | null): void {
    if (token && !this.isTokenExpired(token)) {
      this.writeTokenWithCurrentUser(token);
    } else if (token) {
      this.tokenState.set(null);
      this.synchronizeStatus();
      return;
    } else {
      this.tokenStorage.remove();
    }

    this.tokenState.set(token);
    this.persistCurrentSession();
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

  isTokenExpired(token: AuthToken | null): boolean {
    if (!token?.expiresAt) {
      return false;
    }

    const expiresAtMs = Date.parse(token.expiresAt);

    if (Number.isNaN(expiresAtMs)) {
      return true;
    }

    return expiresAtMs <= Date.now();
  }

  clearExpiredSession(): void {
    if (this.isTokenExpired(this.token()) && !this.hasRefreshToken()) {
      this.logout();
    }
  }

  private readStoredSession(): AuthSession | null {
    const session = this.tokenStorage.read();

    if (!session) {
      return null;
    }

    if (!this.isTokenExpired(session.token) || session.token.refreshToken) {
      return session;
    }

    this.tokenStorage.remove();
    return null;
  }

  private synchronizeStatus(): void {
    const token = this.token();

    if (token && this.isTokenExpired(token)) {
      this.statusState.set(this.user() && token.refreshToken ? 'authenticated' : 'unauthenticated');
      return;
    }

    if (this.user() && token) {
      this.statusState.set('authenticated');
      return;
    }

    this.statusState.set(token ? 'unknown' : 'unauthenticated');
  }

  private persistCurrentSession(): void {
    const user = this.user();
    const token = this.token();

    if (user && token) {
      this.tokenStorage.write({ user, token });
      return;
    }

    if (!user && !token) {
      this.tokenStorage.remove();
    }
  }

  private writeTokenWithCurrentUser(token: AuthToken): void {
    const user = this.user();

    if (user) {
      this.tokenStorage.write({ user, token });
    }
  }
}
