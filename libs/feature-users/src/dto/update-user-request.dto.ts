import { AppRole } from '@daqiq/core';

export interface UpdateUserRequest {
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly AppRole[];
  readonly active: boolean;
}

export interface UpdateUserRpcRequestDto {
  readonly user_id: string;
  readonly email: string;
  readonly display_name: string;
  readonly active: boolean;
  readonly app_roles: readonly AppRole[];
}
