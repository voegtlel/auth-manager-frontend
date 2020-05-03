import {
  Component,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  Output,
  EventEmitter,
  forwardRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, filter } from 'rxjs/operators';
import { GroupInList } from 'src/app/_models/user_group';
import { GroupsService } from 'src/app/_services/groups.service';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ClientAccessGroup } from 'src/app/_models/client';

interface AccessGroupEntry extends GroupInList {
  roles: string;
  index: number;
}

interface AccessGroupTableEntry extends TableEntry {
  data: AccessGroupEntry;
}

@Component({
  selector: 'app-member-groups-access',
  templateUrl: './member-groups-access.component.html',
  styleUrls: ['./member-groups-access.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberGroupsAccessComponent),
      multi: true,
    },
  ],
})
export class MemberGroupsAccessComponent
  implements OnDestroy, OnChanges, AfterViewInit, ControlValueAccessor {
  @Input() accessGroups: ClientAccessGroup[];
  @Output() accessGroupsChange = new EventEmitter<ClientAccessGroup[]>();

  @ViewChild('rolesSelect') rolesSelect: TemplateRef<any>;

  destroyed$ = new Subject<void>();

  groups$ = new BehaviorSubject<ClientAccessGroup[]>(null);

  allGroupsData$: Observable<AccessGroupTableEntry[]>;
  accessGroupsData$: Observable<AccessGroupTableEntry[]>;

  columnsView: TableColumn[] = [
    { key: 'id', title: 'Id' },
    { key: 'group_name', title: 'Name' },
  ];

  columnsEdit: TableColumn[] = this.columnsView;

  loading = true;
  lastError: string;
  _onChange: (groups: ClientAccessGroup[]) => void;
  _onTouched: () => void;

  constructor(
    private groupsService: GroupsService,
    private dialogService: NbDialogService,
    private changeDetector: ChangeDetectorRef
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
          ...(groupsById[userGroup.group] ?? {
            id: userGroup.group,
            visible: false,
            group_name: userGroup.group,
          }),
          roles: userGroup.roles.join(','),
          index,
        }))
      )
    );
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
          (group) =>
            !userGroups.some((userGroup) => userGroup.group === group.id)
        )
      ),
      map((groups) =>
        groups.map((group, index) => ({ data: { ...group, roles: '', index } }))
      )
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.groups) {
      this.groups$.next(changes.groups.currentValue);
    }
  }

  ngAfterViewInit() {
    this.columnsEdit = this.columnsView.concat(
      {
        key: 'roles',
        title: 'Mapped Roles',
        templateRef: this.rolesSelect,
      } as TableColumn,
      {
        action: (groupEntry: AccessGroupTableEntry) =>
          this.removeGroup(groupEntry.data as AccessGroupEntry),
        title: '',
        icon: 'trash',
        compact: true,
      }
    );
    this.changeDetector.detectChanges();
  }

  onAddGroupDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  removeGroup(group: AccessGroupEntry) {
    const idx = this.accessGroups.findIndex(
      (accessGroup) => accessGroup.group === group.id
    );
    if (idx !== -1) {
      this.accessGroups = this.accessGroups
        .slice(0, idx)
        .concat(this.accessGroups.slice(idx + 1));
      this.groups$.next(this.accessGroups);
      this.accessGroupsChange.emit(this.accessGroups);
      if (this._onTouched) {
        this._onTouched();
      }
      if (this._onChange) {
        this._onChange(this.accessGroups);
      }
    }
  }

  addGroupClick(group: AccessGroupEntry) {
    this.accessGroups = this.accessGroups.concat({
      group: group.id,
      roles: [],
    });
    this.groups$.next(this.accessGroups);
    this.accessGroupsChange.emit(this.accessGroups);
    if (this._onTouched) {
      this._onTouched();
    }
    if (this._onChange) {
      this._onChange(this.accessGroups);
    }
  }

  writeValue(value: ClientAccessGroup[]): void {
    this.accessGroups = value;
    this.groups$.next(value);
  }

  updateRoleInput(
    row: AccessGroupTableEntry,
    column: TableColumn,
    $event: string
  ): void {
    this.accessGroups[row.data.index].roles = $event.split(',');
    // Note: Do not next the groups$, because nothing changed in that structure.
    // this.groups$.next(this.accessGroups);
    this.accessGroupsChange.emit(this.accessGroups);
    if (this._onTouched) {
      this._onTouched();
    }
    if (this._onChange) {
      this._onChange(this.accessGroups);
    }
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
}
