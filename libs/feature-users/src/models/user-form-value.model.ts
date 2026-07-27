import { AppRole } from '@daqiq/core';

export interface UserFormValue {
  readonly email: string | null;
  readonly displayName: string | null;
  readonly active: boolean;
  readonly roles: readonly AppRole[] | null;
  readonly password: string | null;
}
