import { UserAdminResponseDto } from './user-admin-response.dto';

export interface UserPageResponseDto {
  readonly items: readonly UserAdminResponseDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
