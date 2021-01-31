export interface GroupInList {
  id: string;

  group_name: string;
  visible: boolean;

  enable_email: boolean;
  enable_postbox: boolean;
}

export interface GroupBase {
  group_name: string;
  notes?: string;

  visible: boolean;

  member_groups: string[];
  members: string[];

  enable_email: boolean;
  enable_postbox: boolean;
  postbox_quota: number;
  email_forward_members: string[];
  email_allowed_forward_members: string[];
  email_postbox_access_members: string[];
}

export interface GroupInRead extends GroupBase {
  id: string;
}

export interface GroupInWrite extends GroupBase {}

export interface GroupInCreate extends GroupBase {
  id: string;
}
