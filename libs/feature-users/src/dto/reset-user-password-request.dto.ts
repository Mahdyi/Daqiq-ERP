export interface ResetUserPasswordRequest {
  readonly newPassword: string;
}

export interface ResetUserPasswordRpcRequestDto {
  readonly user_id: string;
  readonly new_password: string;
}
