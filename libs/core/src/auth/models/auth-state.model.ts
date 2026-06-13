import { User } from './user.model';

export type AuthStatus = 'unknown' | 'unauthenticated' | 'authenticated';

export interface AuthToken {
  readonly accessToken: string;
  readonly tokenType?: string;
  readonly expiresAt?: string;
}

export interface AuthSession {
  readonly user: User;
  readonly token: AuthToken;
}

export interface AuthState {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly token: AuthToken | null;
}
