export interface LoginUserDto {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly roles: readonly string[];
}

export interface LoginResponseDto {
  readonly user: LoginUserDto;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresAt: string;
}
