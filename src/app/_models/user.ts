import { UserProperty } from './schema';
import { UserGroupPropertyType } from './user_view';

export interface UserPasswordAccessToken {
  id?: string;
  description: string;
  token?: string;
}

export interface UserPropertyWithValue extends UserProperty {
  value: any;
}

export interface UserViewDataGroup {
  title: string;
  type: UserGroupPropertyType;
  properties: UserPropertyWithValue[];
}

export interface UserViewData {
  user_id: string;
  view_groups: UserViewDataGroup[];
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
  view_id: string;
  view_name: string;
  properties: UserProperty[];
  users: UserListViewData[];
}

export interface PasswordReset {
  email: string;
}

export interface PasswordInWrite {
  password: string;
}

export interface UserUpdateResult {
  link: string | null;
}
