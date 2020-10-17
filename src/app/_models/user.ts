export interface EnumValue {
  value: string;
  title: string;
}

export type PermissionType =
  | 'everybody'
  | 'self'
  | 'only_self'
  | 'admin'
  | 'nobody';

export type PropertyType =
  | 'str'
  | 'multistr'
  | 'token'
  | 'int'
  | 'datetime'
  | 'date'
  | 'bool'
  | 'enum'
  | 'picture'
  | 'email'
  | 'password'
  | 'groups'
  | 'access_token';

export interface UserProperty {
  type: PropertyType;
  format: string;
  format_help: string;
  can_edit: PermissionType;
  can_read: PermissionType;
  write_once: boolean;
  default: any;
  visible: PermissionType;
  title: string;
  values: EnumValue[];
  template: string;
  required: boolean;
}

export interface UserPasswordAccessToken {
  id?: string;
  description: string;
  token?: string;
}

export interface UserPropertyWithKey extends UserProperty {
  key: string;
}

export interface UserPropertyWithValue extends UserPropertyWithKey {
  value: any;
}

export interface UserViewData {
  user_id: string;
  properties?: UserPropertyWithValue[];
}

export interface UserListProperty {
  key: string;
  value: any;
}

export interface UserListViewData {
  user_id: string;
  properties?: UserListProperty[];
}

export interface UsersListViewData {
  properties: UserPropertyWithKey[];
  users: UserListViewData[];
}
