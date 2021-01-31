export type UserFilterOp =
  | 'and'
  | 'or'
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'ge'
  | 'le'
  | 'not';

export interface UserFilter {
  op: UserFilterOp;
  field?: string;
  value?: any;
  operands?: UserFilter[];
  operand?: UserFilter;
}

export type UserGroupPropertyType = 'default' | 'email' | 'password';

export interface UserViewGroup {
  title: string;
  type: UserGroupPropertyType;
  user_properties: string[];
}

export interface UserViewInList {
  id: string;

  group_id?: string;
  name: string;
  filter?: UserFilter;

  protected?: boolean;
}

export interface UserViewBase {
  name: string;
  filter?: UserFilter;
  list_properties: string[];
  view_groups: UserViewGroup[];
}

export interface UserViewInRead extends UserViewBase {
  id: string;
  group_id?: string;
  protected?: boolean;
}

export interface UserViewInWrite extends UserViewBase {}
