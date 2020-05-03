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

@Component({
  selector: 'app-member-groups',
  templateUrl: './member-groups.component.html',
  styleUrls: ['./member-groups.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberGroupsComponent),
      multi: true,
    },
  ],
})
export class MemberGroupsComponent
  implements OnDestroy, OnChanges, ControlValueAccessor {
  @Input() groups: string[];
  @Input() readOnly = false;
  @Output() groupsChange = new EventEmitter<string[]>();
  @Input() excludeGroups: string[] = [];

  destroyed$ = new Subject<void>();

  groups$ = new BehaviorSubject<string[]>(null);

  allGroupsData$: Observable<TableEntry[]>;

  groupsData$: Observable<TableEntry[]>;

  columnsView: TableColumn[] = [
    { key: 'id', title: 'Id' },
    { key: 'group_name', title: 'Name' },
  ];

  columnsEdit: TableColumn[] = this.columnsView.concat({
    action: (groupEntry: TableEntry) =>
      this.removeGroup(groupEntry.data as GroupInList),
    title: '',
    icon: 'trash',
    compact: true,
  });

  loading = true;
  lastError: string;
  _onChange: (groups: string[]) => void;
  _onTouched: () => void;

  constructor(
    private groupsService: GroupsService,
    private dialogService: NbDialogService
  ) {
    this.groupsService.groups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.loading = false;
      });
    const userGroups$ = combineLatest([
      this.groups$.pipe(filter((g) => !!g)),
      this.groupsService.groupsById$,
    ]).pipe(
      map(([userGroups, groupsById]) =>
        userGroups.map((userGroup) => groupsById[userGroup])
      )
    );
    this.groupsData$ = userGroups$.pipe(
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
            !userGroups.includes(group.id) &&
            !this.excludeGroups.includes(group.id)
        )
      ),
      map((groups) => groups.map((group) => ({ data: group })))
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

  onAddGroupDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  removeGroup(group: GroupInList) {
    const idx = this.groups.indexOf(group.id);
    if (idx !== -1) {
      this.groups = this.groups
        .slice(0, idx)
        .concat(this.groups.slice(idx + 1));
      this.groups$.next(this.groups);
      this.groupsChange.emit(this.groups);
      if (this._onTouched) {
        this._onTouched();
      }
      if (this._onChange) {
        this._onChange(this.groups);
      }
    }
  }

  addGroupClick(group: GroupInList) {
    this.groups = this.groups.concat(group.id);
    this.groups$.next(this.groups);
    this.groupsChange.emit(this.groups);
    if (this._onTouched) {
      this._onTouched();
    }
    if (this._onChange) {
      this._onChange(this.groups);
    }
  }

  writeValue(value: string[]): void {
    this.groups = value;
    this.groups$.next(value);
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.readOnly = isDisabled;
  }
}
