export interface UserAdminResponseDto {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly roles: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt: string | null;
}
