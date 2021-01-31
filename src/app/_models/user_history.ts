export interface UserHistoryChange {
  property: string;
  value: any;
}

export interface UserHistoryInList {
  timestamp: string;
  author_id: string;
  changes: UserHistoryChange[];
}
