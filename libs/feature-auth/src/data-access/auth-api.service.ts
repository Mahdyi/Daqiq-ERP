import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, SKIP_AUTH_TOKEN } from '@daqiq/core';
import { Observable } from 'rxjs';

import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';

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
}
