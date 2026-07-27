import { CreateUserRequest } from '../dto/create-user-request.dto';
import { UpdateUserRequest } from '../dto/update-user-request.dto';
import { ManagedUser } from '../models/user.model';
import { UserFormValue } from '../models/user-form-value.model';

export const DEFAULT_USER_FORM_VALUE: UserFormValue = {
  email: null,
  displayName: null,
  active: true,
  roles: ['viewer'],
  password: null
};

export function mapUserToFormValue(user: ManagedUser): UserFormValue {
  return {
    email: user.email,
    displayName: user.displayName,
    active: user.active,
    roles: user.roles,
    password: null
  };
}

export function mapFormValueToCreateUserRequest(
  value: Readonly<UserFormValue>
): CreateUserRequest {
  return {
    email: requiredString(value.email),
    displayName: requiredString(value.displayName),
    password: requiredString(value.password),
    roles: value.roles ?? [],
    active: value.active
  };
}

export function mapFormValueToUpdateUserRequest(
  value: Readonly<UserFormValue>
): UpdateUserRequest {
  return {
    email: requiredString(value.email),
    displayName: requiredString(value.displayName),
    roles: value.roles ?? [],
    active: value.active
  };
}

function requiredString(value: string | null): string {
  return value?.trim() ?? '';
}
