export interface GroupInList {
  id: string;

  group_name: string;
  group_type: string;
  visible: boolean;

  enable_email: boolean;
  enable_postbox: boolean;
}

export interface GroupBase {
  group_name: string;
  group_type: string;
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

  email_managed_mailing_list: boolean;
  email_managed_mailing_list_notify_members: string[];
  email_managed_mailing_list_forward_to_notifiers: boolean;
  email_managed_mailing_list_send_notification_to_sender: boolean;
}

export interface GroupInRead extends GroupBase {
  id: string;
}

export interface GroupInWrite extends GroupBase {}

export interface GroupInCreate extends GroupBase {
  id: string;
}
