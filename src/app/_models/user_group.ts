export interface GroupInList {
  id: string;
  group_name: string;
  visible: boolean;
  enable_email: boolean;
  enable_postbox: boolean;
}

export interface Group {
  notes: string;
  group_name: string;
  visible: boolean;
  member_groups: string[];
  members: string[];
  enable_email: boolean;
  enable_postbox: boolean;
  postbox_quota: number;
  email_allowed_forward_members: string[];
  email_forward_members: string[];
  email_postbox_access_members: string[];
}

export interface GroupWithId extends Group {
  id: string;
}
