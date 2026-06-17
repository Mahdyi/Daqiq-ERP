import { AuthSession, PermissionCode, RoleCode } from '@daqiq/core';

import { LoginResponseDto } from '../dto/login-response.dto';

export function mapLoginResponseToAuthSession(response: LoginResponseDto): AuthSession {
  return {
    user: {
      id: response.user.id,
      username: response.user.username,
      displayName: response.user.displayName,
      email: response.user.email,
      roles: response.user.roles.map((role) => ({
        code: role as RoleCode,
        name: role
      })),
      permissions: response.user.permissions?.map((permission) => permission as PermissionCode)
    },
    token: {
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresAt: response.expiresAt
    }
  };
}
