import { AuthSession, normalizeRoles } from '@daqiq/core';

import { LoginResponseDto } from '../dto/login-response.dto';

export function mapLoginResponseToAuthSession(response: LoginResponseDto): AuthSession {
  const roles = normalizeRoles(response.user.roles);

  return {
    user: {
      id: response.user.id,
      username: response.user.email,
      displayName: response.user.displayName,
      email: response.user.email,
      roles: roles.map((role) => ({
        code: role,
        name: role
      }))
    },
    token: {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType,
      expiresAt: response.expiresAt
    }
  };
}
