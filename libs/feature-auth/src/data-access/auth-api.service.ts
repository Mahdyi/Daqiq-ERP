import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, SKIP_AUTH_TOKEN } from '@daqiq/core';
import { Observable } from 'rxjs';

import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { LogoutRequestDto } from '../dto/logout-request.dto';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { RefreshSessionRequestDto } from '../dto/refresh-session-request.dto';

interface RefreshSessionRpcRequestDto {
  readonly refresh_token: string;
}

interface LogoutRpcRequestDto {
  readonly refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly api = inject(ApiClient);

  login(request: LoginRequestDto): Observable<LoginResponseDto> {
    return this.api.post<LoginRequestDto, LoginResponseDto>('rpc/login', request, {
      responseShape: 'raw',
      context: new HttpContext().set(SKIP_AUTH_TOKEN, true)
    });
  }

  refreshSession(request: RefreshSessionRequestDto): Observable<LoginResponseDto> {
    return this.api.post<RefreshSessionRpcRequestDto, LoginResponseDto>(
      'rpc/refresh_session',
      {
        refresh_token: request.refreshToken
      },
      {
        responseShape: 'raw',
        context: new HttpContext().set(SKIP_AUTH_TOKEN, true)
      }
    );
  }

  logout(request: LogoutRequestDto): Observable<LogoutResponseDto> {
    return this.api.post<LogoutRpcRequestDto, LogoutResponseDto>(
      'rpc/logout',
      {
        refresh_token: request.refreshToken
      },
      {
        responseShape: 'raw',
        context: new HttpContext().set(SKIP_AUTH_TOKEN, true)
      }
    );
  }
}
