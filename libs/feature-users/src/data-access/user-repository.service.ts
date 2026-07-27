import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { CrudResource } from '@daqiq/shared';
import { Observable, map } from 'rxjs';

import {
  CreateUserRequest,
  CreateUserRpcRequestDto
} from '../dto/create-user-request.dto';
import {
  ResetUserPasswordRequest,
  ResetUserPasswordRpcRequestDto
} from '../dto/reset-user-password-request.dto';
import {
  UpdateUserRequest,
  UpdateUserRpcRequestDto
} from '../dto/update-user-request.dto';
import { UserAdminResponseDto } from '../dto/user-admin-response.dto';
import { UserPageResponseDto } from '../dto/user-page-response.dto';
import { mapUserPageResponseDto, mapUserResponseDto } from '../mappers/user.mapper';
import { ManagedUser } from '../models/user.model';
import { UserQuery } from '../models/user-query.model';

interface ListUsersRpcRequestDto {
  readonly search?: string;
  readonly active?: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

interface UserIdRpcRequestDto {
  readonly user_id: string;
}

interface SuccessResponseDto {
  readonly success: boolean;
}

@Injectable()
export class UserRepository
  implements CrudResource<ManagedUser, string, CreateUserRequest, UpdateUserRequest, UserQuery>
{
  private readonly api = inject(ApiClient);

  list(query?: UserQuery): Observable<ApiPage<ManagedUser>> {
    const request: ListUsersRpcRequestDto = {
      search: query?.search,
      active: query?.active,
      page_number: (query?.page ?? 0) + 1,
      page_size: query?.pageSize ?? 20
    };

    return this.api
      .post<ListUsersRpcRequestDto, UserPageResponseDto>('rpc/admin_list_users', request, {
        responseShape: 'raw'
      })
      .pipe(map(mapUserPageResponseDto));
  }

  getById(id: string): Observable<ManagedUser> {
    return this.api
      .post<UserIdRpcRequestDto, UserAdminResponseDto>(
        'rpc/admin_get_user',
        {
          user_id: id
        },
        {
          responseShape: 'raw'
        }
      )
      .pipe(map(mapUserResponseDto));
  }

  create(request: CreateUserRequest): Observable<ManagedUser> {
    return this.api
      .post<CreateUserRpcRequestDto, UserAdminResponseDto>(
        'rpc/admin_create_user',
        {
          email: request.email,
          display_name: request.displayName,
          password: request.password,
          app_roles: request.roles,
          active: request.active
        },
        {
          responseShape: 'raw'
        }
      )
      .pipe(map(mapUserResponseDto));
  }

  update(id: string, request: UpdateUserRequest): Observable<ManagedUser> {
    return this.api
      .post<UpdateUserRpcRequestDto, UserAdminResponseDto>(
        'rpc/admin_update_user',
        {
          user_id: id,
          email: request.email,
          display_name: request.displayName,
          active: request.active,
          app_roles: request.roles
        },
        {
          responseShape: 'raw'
        }
      )
      .pipe(map(mapUserResponseDto));
  }

  delete(id: string): Observable<void> {
    return this.deactivate(id).pipe(map(() => undefined));
  }

  resetPassword(id: string, request: ResetUserPasswordRequest): Observable<void> {
    return this.api
      .post<ResetUserPasswordRpcRequestDto, SuccessResponseDto>(
        'rpc/admin_reset_user_password',
        {
          user_id: id,
          new_password: request.newPassword
        },
        {
          responseShape: 'raw'
        }
      )
      .pipe(map(() => undefined));
  }

  activate(id: string): Observable<ManagedUser> {
    return this.api
      .post<UserIdRpcRequestDto, UserAdminResponseDto>(
        'rpc/admin_activate_user',
        {
          user_id: id
        },
        {
          responseShape: 'raw'
        }
      )
      .pipe(map(mapUserResponseDto));
  }

  deactivate(id: string): Observable<ManagedUser> {
    return this.api
      .post<UserIdRpcRequestDto, UserAdminResponseDto>(
        'rpc/admin_deactivate_user',
        {
          user_id: id
        },
        {
          responseShape: 'raw'
        }
      )
      .pipe(map(mapUserResponseDto));
  }
}
