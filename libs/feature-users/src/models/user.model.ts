import { AppRole } from '@daqiq/core';

export interface ManagedUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly roles: readonly AppRole[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt: Date | null;
}
