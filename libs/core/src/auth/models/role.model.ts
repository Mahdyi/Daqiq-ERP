export type RoleCode = string;

export type PermissionCode = string;

export interface Role {
  readonly code: RoleCode;
  readonly name: string;
  readonly permissions?: readonly PermissionCode[];
}
