import {
  Component,
  Input,
  TemplateRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { GroupInList } from 'src/app/_models/group';
import { GroupsService } from 'src/app/_services/groups.service';
import {
  TableColumn,
  ITableEntry,
} from 'src/app/_components/table/table.component';
import {
  ClientAccessGroupFormGroup,
  ClientAccessGroupsFormArray,
} from 'src/app/_forms/client-form';
import { map } from 'rxjs/operators';

declare type AccessGroupTableEntry = ITableEntry<ClientAccessGroupFormGroup>;

@Component({
  selector: 'app-member-groups-access',
  templateUrl: './member-groups-access.component.html',
  styleUrls: ['./member-groups-access.component.scss'],
})
export class MemberGroupsAccessComponent implements OnInit {
  @Input() accessGroupsFormArray: ClientAccessGroupsFormArray;

  @ViewChild('rolesSelect', { static: true }) rolesSelect: TemplateRef<any>;

  columnsAdd: TableColumn[] = [
    { key: 'id', title: 'Id' },
    { key: 'group_name', title: 'Name' },
  ];

  columnsView: TableColumn[] = [
    { key: 'group_id', title: 'Id', clickableCells: true },
    {
      key: 'group_name',
      value$: (entry: AccessGroupTableEntry) =>
        entry.data.controls.group.group$.pipe(map((group) => group.group_name)),
      title: 'Name',
      clickableCells: true,
    },
  ];

  columnsEdit: TableColumn[];

  allGroupsData$ = this.groupsService.groups$;

  constructor(private groupsService: GroupsService) {}

  ngOnInit(): void {
    this.columnsEdit = this.columnsView.concat(
      {
        key: 'roles',
        title: 'Mapped Roles',
        templateRef: this.rolesSelect,
      } as TableColumn,
      {
        key: '_remove',
        action: (groupEntry: AccessGroupTableEntry) =>
          this.removeGroup(groupEntry.data),
        title: '',
        icon: 'trash',
        compact: true,
      } as TableColumn
    );
  }

  idControl = (control: ClientAccessGroupFormGroup) =>
    control.controls.group.value;
  idAllData = (data: GroupInList) => data.id;

  removeGroup(group: ClientAccessGroupFormGroup) {
    const idx = this.accessGroupsFormArray.controls.indexOf(group);
    if (idx !== -1) {
      this.accessGroupsFormArray.removeAt(idx);
      this.accessGroupsFormArray.markAsDirty();
      this.accessGroupsFormArray.updateValueAndValidity();
    }
  }

  addGroup(group: GroupInList) {
    this.accessGroupsFormArray.add(group.id);
    this.accessGroupsFormArray.markAsDirty();
    this.accessGroupsFormArray.updateValueAndValidity();
  }

  updateRoleInput(row: AccessGroupTableEntry, $event: string): void {
    row.data.controls.roles.setValueByCommaSeparatedString($event);
  }
}
