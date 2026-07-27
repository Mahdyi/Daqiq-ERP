import { AppRole } from '@daqiq/core';

export interface CreateUserRequest {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
  readonly roles: readonly AppRole[];
  readonly active: boolean;
}

export interface CreateUserRpcRequestDto {
  readonly email: string;
  readonly display_name: string;
  readonly password: string;
  readonly app_roles: readonly AppRole[];
  readonly active: boolean;
}
