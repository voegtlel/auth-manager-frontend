export interface EnumValue {
  value: string;
  title: string;
}

export type AccessType =
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
  | 'password'
  | 'email'
  | 'picture'
  | 'groups'
  | 'token'
  | 'access_token';

export interface UserProperty {
  key: string;

  type: PropertyType;
  format?: string;
  format_help?: string;
  can_edit: AccessType;
  can_read: AccessType;
  write_once?: boolean;
  default?: any;
  visible: AccessType;
  title: string;
  values?: EnumValue[];
  template?: string;
  required?: boolean;

  protected?: boolean;
}

export interface UserScopeProperty {
  user_property: string;
  key?: string;

  group_type?: string;
}

export interface UserScope {
  key: string;
  title: string;
  protected: boolean;
  properties: UserScopeProperty[];
}

export interface GroupType {
  key: string;
  title: string;
}

export interface ManagerSchema {
  user_properties: UserProperty[];
  scopes: UserScope[];
  group_types: GroupType[];
}
