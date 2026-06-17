import { Injectable } from '@angular/core';

import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { LOGIN_LABELS } from '../models/login-form-value.model';

const MOCK_LOGIN_DELAY_MS = 450;
const MOCK_ADMIN_EMAIL = 'admin@erp.com';
const MOCK_ADMIN_PASSWORD = 'admin';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    await this.delay();

    if (request.email !== MOCK_ADMIN_EMAIL || request.password !== MOCK_ADMIN_PASSWORD) {
      throw new Error(LOGIN_LABELS.invalidCredentials);
    }

    return {
      user: {
        id: '1',
        username: request.email,
        displayName: 'مدیر سیستم',
        email: request.email,
        roles: ['admin'],
        permissions: []
      },
      accessToken: 'mock-access-token-for-step-9',
      tokenType: 'Bearer'
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => {
      globalThis.setTimeout(resolve, MOCK_LOGIN_DELAY_MS);
    });
  }
}
