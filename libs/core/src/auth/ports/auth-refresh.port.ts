export interface AuthRefreshResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType?: string;
  readonly expiresAt: string;
}

export interface AuthRefreshPort {
  refresh(refreshToken: string): Promise<AuthRefreshResult>;
}
