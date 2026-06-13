import { PermissionCode, Role } from './role.model';

export interface User {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email?: string;
  readonly roles: readonly Role[];
  readonly permissions?: readonly PermissionCode[];
}
