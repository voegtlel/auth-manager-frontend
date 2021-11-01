import {
  Component,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  Output,
  EventEmitter,
  ViewChild,
  OnInit,
} from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import {
  takeUntil,
  map,
  filter,
  distinctUntilChanged,
  shareReplay,
} from 'rxjs/operators';
import { GroupInList } from 'src/app/_models/group';
import { GroupsService } from 'src/app/_services/groups.service';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { UserPropertyWithValue } from 'src/app/_models/user';

interface AccessGroupEntry extends GroupInList {
  index: number;
}

interface AccessGroupTableEntry extends TableEntry {
  data: AccessGroupEntry;
}

interface GroupTableColumn extends TableColumn {
  property?: UserPropertyWithValue;
}

@Component({
  selector: 'app-member-groups-options',
  templateUrl: './member-groups-options.component.html',
  styleUrls: ['./member-groups-options.component.scss'],
})
export class MemberGroupsOptionsComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() groups: string[];
  @Output() groupsChange = new EventEmitter<string[]>();
  @Input() readOnly = false;
  @Input() isAdmin: boolean;
  @Input() isSelf: boolean;

  readOnly$ = new BehaviorSubject<boolean>(true);
  groups$ = new BehaviorSubject<string[]>(null);

  @Input() additionalGroups: UserPropertyWithValue[] = [];
  @Output() additionalGroupsChange = new EventEmitter<{
    property: UserPropertyWithValue;
    value: string[];
  }>();
  additionalGroupsReadOnlyKeys: Record<string, string[]> = {
    email_allowed_forward_groups: ['enable_email'],
    email_forward_groups: ['enable_email', 'email_allowed_forward_groups'],
    email_postbox_access_groups: ['enable_postbox'],
  };
  additionalGroups$ = new BehaviorSubject<UserPropertyWithValue[]>([]);

  @ViewChild('additionalGroupCheckbox', { static: true })
  additionalGroupCheckbox: TemplateRef<any>;

  destroyed$ = new Subject<void>();

  allGroupsData$: Observable<AccessGroupTableEntry[]>;
  accessGroupsData$: Observable<AccessGroupTableEntry[]>;

  columnsView: GroupTableColumn[] = [
    { key: 'id', title: 'Id', clickableCells: true },
    { key: 'group_name', title: 'Name', clickableCells: true },
  ];

  columnsEdit: GroupTableColumn[] = this.columnsView;

  loading = true;
  lastError: string;

  constructor(
    private groupsService: GroupsService,
    private dialogService: NbDialogService
  ) {
    this.groupsService.groups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.loading = false;
      });
    const userGroups$: Observable<AccessGroupEntry[]> = combineLatest([
      this.groups$.pipe(filter((g) => !!g)),
      this.groupsService.groupsById$,
    ]).pipe(
      map(([userGroups, groupsById]) =>
        userGroups.map((userGroup, index) => ({
          ...(groupsById[userGroup] ?? {
            id: userGroup,
            visible: false,
            group_name: userGroup,
            group_type: null,
            enable_email: false,
            enable_postbox: false,
          }),
          index,
        }))
      ),
      shareReplay(1)
    );
    combineLatest([userGroups$, this.additionalGroups$])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([userGroups, additionalGroups]) => {
        for (const userGroup of userGroups) {
          for (const additionalGroup of additionalGroups) {
            userGroup[additionalGroup.key] = additionalGroup.value.includes(
              userGroup.id
            );
          }
        }
      });
    this.accessGroupsData$ = userGroups$.pipe(
      map((groups) =>
        groups.map((group) => ({
          data: group,
        }))
      )
    );
    this.allGroupsData$ = combineLatest([
      this.groups$.pipe(filter((g) => !!g)),
      this.groupsService.groups$.pipe(takeUntil(this.destroyed$)),
    ]).pipe(
      map(([userGroups, allGroups]) =>
        allGroups.filter(
          (group) => !userGroups.some((userGroup) => userGroup === group.id)
        )
      ),
      map((groups) =>
        groups.map((group, index) => ({
          data: {
            ...group,
            index,
          },
        }))
      )
    );
  }

  ngOnInit(): void {
    combineLatest([this.additionalGroups$, this.readOnly$])
      .pipe(
        distinctUntilChanged(
          ([x1, x2], [y1, y2]) =>
            x1.map((x) => x.key) === y1.map((x) => x.key) && x2 === y2
        )
      )
      .subscribe(([additionalGroups, readOnly]) => {
        const columnsEdit: GroupTableColumn[] = [
          { key: 'id', title: 'Id' },
          { key: 'group_name', title: 'Name' },
        ];
        for (const additionalGroup of additionalGroups) {
          const col: GroupTableColumn = {
            key: additionalGroup.key,
            title: additionalGroup.title,
            templateRef: this.additionalGroupCheckbox,
            compact2: true,
            centerCells: true,
            noPaddingCells: true,
            property: additionalGroup,
          };
          col.onClickItem = (row) =>
            this.updateInput(
              row as AccessGroupTableEntry,
              col,
              !row.data[additionalGroup.key]
            );
          columnsEdit.push(col);
        }
        if (!readOnly) {
          columnsEdit.push({
            key: '_remove',
            action: (groupEntry: AccessGroupTableEntry) =>
              this.removeGroup(groupEntry.data as AccessGroupEntry),
            title: '',
            icon: 'trash',
            compact: true,
            centerCells: true,
          } as GroupTableColumn);
        }
        this.columnsEdit = columnsEdit;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.groups) {
      this.groups$.next(changes.groups.currentValue);
    }
    if (changes.additionalGroups) {
      this.additionalGroups$.next(changes.additionalGroups.currentValue);
    }
    if (changes.readOnly) {
      this.readOnly$.next(changes.readOnly.currentValue);
    }
  }

  canEdit(property: UserPropertyWithValue): boolean {
    return (
      (property.can_edit === 'self' && (this.isSelf || this.isAdmin)) ||
      (property.can_edit === 'admin' && this.isAdmin) ||
      property.can_edit === 'everybody'
    );
  }

  additionalGroupReadOnly(
    property: UserPropertyWithValue,
    row: AccessGroupTableEntry
  ) {
    return (
      !this.canEdit(property) ||
      this.additionalGroupsReadOnlyKeys[property.key]?.some(
        (key) => !row.data[key]
      )
    );
  }

  onAddGroupDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  removeGroup(group: AccessGroupEntry) {
    const idx = this.groups.indexOf(group.id);
    if (idx !== -1) {
      this.groups = this.groups
        .slice(0, idx)
        .concat(this.groups.slice(idx + 1));
      for (const additionalGroup of this.additionalGroups) {
        const additionalIdx = additionalGroup.value.indexOf(group.id);
        if (additionalIdx !== -1) {
          additionalGroup.value = additionalGroup.value
            .slice(0, idx)
            .concat(additionalGroup.value.slice(idx + 1));
          // this.additionalGroups$.next(this.additionalGroups);
          this.additionalGroupsChange.emit({
            property: additionalGroup,
            value: additionalGroup.value,
          });
        }
      }
      this.groups$.next(this.groups);
      this.groupsChange.emit(this.groups);
    }
  }

  addGroupClick(group: AccessGroupEntry) {
    this.groups = this.groups.concat(group.id);
    this.groups$.next(this.groups);
    this.groupsChange.emit(this.groups);
  }

  updateInput(
    row: AccessGroupTableEntry,
    column: GroupTableColumn,
    $event: boolean
  ): void {
    if (this.additionalGroupReadOnly(column.property, row)) {
      return;
    }
    row.data[column.key] = $event;
    if ($event) {
      if (!column.property.value.includes(row.data.id)) {
        column.property.value = column.property.value.concat(row.data.id);
        this.additionalGroupsChange.emit({
          property: column.property,
          value: column.property.value,
        });
      }
    } else {
      const idx = column.property.value.indexOf(row.data.id);
      if (idx !== -1) {
        column.property.value = column.property.value
          .slice(0, idx)
          .concat(column.property.value.slice(idx + 1));
        this.additionalGroupsChange.emit({
          property: column.property,
          value: column.property.value,
        });
      }
    }
  }
}
