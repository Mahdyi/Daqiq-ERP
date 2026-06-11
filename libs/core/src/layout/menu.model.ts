export interface CoreMenuItem {
  readonly label: string;
  readonly route?: string;
  readonly icon?: string;
  readonly children?: readonly CoreMenuItem[];
  readonly disabled?: boolean;
  readonly requiredRoles?: readonly string[];
  readonly requiredPermissions?: readonly string[];
}
