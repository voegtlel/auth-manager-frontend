import { Component, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { GroupInList } from 'src/app/_models/group';
import { GroupsService } from 'src/app/_services/groups.service';
import {
  TableColumn,
  ITableEntry,
} from 'src/app/_components/table/table.component';
import {
  MemberGroupFormControl,
  MembersFormArray,
} from 'src/app/_forms/user-group-form';

declare type GroupTableEntry = ITableEntry<MemberGroupFormControl>;

@Component({
  selector: 'app-member-groups',
  templateUrl: './member-groups.component.html',
  styleUrls: ['./member-groups.component.scss'],
})
export class MemberGroupsComponent {
  @Input() membersFormArray: MembersFormArray;
  @Input() excludeGroups: string[] = [];

  columnsAdd: TableColumn[] = [
    { key: 'id', title: 'Id' },
    {
      key: 'group_name',
      title: 'Name',
    },
  ];

  columnsView: TableColumn[] = [
    { key: 'value', title: 'Id', clickableCells: true },
    {
      key: 'group_name',
      value$: (entry: GroupTableEntry) =>
        entry.data.group$.pipe(map((group) => group.group_name)),
      title: 'Name',
      clickableCells: true,
    },
  ];

  columnsEdit: TableColumn[] = this.columnsView.concat({
    action: (groupEntry: GroupTableEntry) =>
      this.removeGroup(groupEntry.data as MemberGroupFormControl),
    title: '',
    icon: 'trash',
    compact: true,
  });

  allGroupsData$ = this.groupsService.groups$;

  constructor(private groupsService: GroupsService) {}

  idControl = (control: MemberGroupFormControl) => control.value;
  idAllData = (data: GroupInList) => data.id;

  removeGroup(group: MemberGroupFormControl) {
    const idx = this.membersFormArray.controls.indexOf(group);
    if (idx !== -1) {
      this.membersFormArray.removeAt(idx);
      this.membersFormArray.markAsDirty();
      this.membersFormArray.updateValueAndValidity();
    }
  }

  addGroup(group: GroupInList) {
    this.membersFormArray.add(group.id);
    this.membersFormArray.markAsDirty();
    this.membersFormArray.updateValueAndValidity();
  }
}
