export interface LoginUserDto {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly permissions?: readonly string[];
}

export interface LoginResponseDto {
  readonly user: LoginUserDto;
  readonly accessToken: string;
  readonly tokenType?: string;
  readonly expiresAt?: string;
}
