export interface GroupInList {
  id: string;
  group_name: string;
  visible: boolean;
}

export interface Group {
  notes: string;
  group_name: string;
  visible: boolean;
  member_groups: string[];
  members: string[];
}

export interface GroupWithId extends Group {
  id: string;
}
