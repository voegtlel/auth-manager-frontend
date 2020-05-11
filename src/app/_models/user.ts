export interface EnumValue {
  value: string;
  title: string;
}

export interface UserProperty {
  type:
    | 'str'
    | 'multistr'
    | 'datetime'
    | 'date'
    | 'bool'
    | 'enum'
    | 'picture'
    | 'email'
    | 'password'
    | 'groups';
  format: string;
  format_help: string;
  can_edit: 'everybody' | 'self' | 'admin' | 'nobody';
  can_read: 'everybody' | 'self' | 'admin' | 'nobody';
  write_once: boolean;
  default: any;
  visible: 'everybody' | 'self' | 'admin' | 'nobody';
  title: string;
  values: EnumValue[];
  template: string;
  required: boolean;
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
