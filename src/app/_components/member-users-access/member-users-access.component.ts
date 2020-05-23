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
  OnInit,
} from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, filter, shareReplay } from 'rxjs/operators';
import { GroupsService } from 'src/app/_services/groups.service';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UsersService } from 'src/app/_services/users.service';

export interface GroupUserEmailAccess {
  user_id: string;
  access_email_allowed_forward: boolean;
  access_email_forward: boolean;
  access_email_postbox_access: boolean;
}

interface UserData extends GroupUserEmailAccess {
  [key: string]: any;

  index: number;
}

interface UserTableEntry extends TableEntry {
  data: UserData;
}

@Component({
  selector: 'app-member-users-access',
  templateUrl: './member-users-access.component.html',
  styleUrls: ['./member-users-access.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberUsersAccessComponent),
      multi: true,
    },
  ],
})
export class MemberUsersAccessComponent
  implements OnDestroy, OnInit, OnChanges, ControlValueAccessor {
  @Input() users: GroupUserEmailAccess[];
  @Output() usersChange = new EventEmitter<GroupUserEmailAccess[]>();
  @Input() enabledForwarding: boolean;
  @Input() enabledPostbox: boolean;

  @ViewChild('emailAllowedForwardCheckbox', { static: true })
  emailAllowedForwardCheckbox: TemplateRef<any>;
  @ViewChild('emailForwardCheckbox', { static: true })
  emailForwardCheckbox: TemplateRef<any>;
  @ViewChild('emailPostboxAccessCheckbox', { static: true })
  emailPostboxAccessCheckbox: TemplateRef<any>;

  destroyed$ = new Subject<void>();

  users$ = new BehaviorSubject<GroupUserEmailAccess[]>(null);

  allUsersData$: Observable<UserTableEntry[]>;
  usersData$: Observable<UserTableEntry[]>;

  columnsView$: Observable<TableColumn[]>;
  columnsEdit$: Observable<TableColumn[]>;

  readOnly = false;

  loading = true;
  lastError: string;
  _onChange: (groups: GroupUserEmailAccess[]) => void;
  _onTouched: () => void;

  constructor(
    private groupsService: GroupsService,
    private usersService: UsersService,
    private dialogService: NbDialogService
  ) {
    this.groupsService.groups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.loading = false;
      });
    const users$: Observable<UserData[]> = combineLatest([
      this.users$.pipe(filter((u) => !!u)),
      this.usersService.usersById$,
    ]).pipe(
      map(([users, usersById]) =>
        users.map((user, index) => ({
          ...(usersById[user.user_id] ?? {
            properties: [],
            user_id: user.user_id,
          }),
          access_email_allowed_forward: user.access_email_allowed_forward,
          access_email_forward: user.access_email_forward,
          access_email_postbox_access: user.access_email_postbox_access,
          index,
        }))
      )
    );
    this.usersData$ = users$.pipe(
      map((users) =>
        users.map((user, index) => ({
          data: user.properties.reduce(
            (o, v) => {
              o[v.key] = v.value;
              return o;
            },
            {
              user_id: user.user_id,
              access_email_allowed_forward: user.access_email_allowed_forward,
              access_email_forward: user.access_email_forward,
              access_email_postbox_access: user.access_email_postbox_access,
              index,
            }
          ),
        }))
      )
    );
    this.allUsersData$ = combineLatest([
      this.users$.pipe(filter((u) => !!u)),
      this.usersService.users$.pipe(takeUntil(this.destroyed$)),
    ]).pipe(
      map(([users, allUsers]) =>
        allUsers.filter(
          (user) => !users.some((user2) => user2.user_id === user.user_id)
        )
      ),
      map((users) =>
        users.map((user, index) => ({
          data: user.properties.reduce(
            (o, v) => {
              o[v.key] = v.value;
              return o;
            },
            {
              user_id: user.user_id,
              access_email_allowed_forward: false,
              access_email_forward: false,
              access_email_postbox_access: false,
              index,
            }
          ),
        }))
      ),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    this.columnsView$ = this.usersService.properties$.pipe(
      map((properties) =>
        properties
          .filter((prop) => prop.visible)
          .map((prop) => ({ ...prop, clickableCells: true }))
      )
    );
    this.columnsEdit$ = this.usersService.properties$.pipe(
      map(
        (properties) =>
          properties.filter((prop) => prop.visible) as TableColumn[]
      ),
      map((columns) =>
        columns.concat(
          {
            key: 'access_email_allowed_forward',
            title: 'Allow Forward E-Mail',
            templateRef: this.emailAllowedForwardCheckbox,
            onClickItem: (row) =>
              this.updateInput(
                row as UserTableEntry,
                { key: 'access_email_allowed_forward', title: '' },
                !row.data.access_email_allowed_forward
              ),
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            key: 'access_email_forward',
            title: 'Forward E-Mail',
            templateRef: this.emailForwardCheckbox,
            onClickItem: (row) =>
              this.updateInput(
                row as UserTableEntry,
                { key: 'access_email_forward', title: '' },
                !row.data.access_email_forward
              ),
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            key: 'access_email_postbox_access',
            title: 'Access Postbox',
            templateRef: this.emailPostboxAccessCheckbox,
            onClickItem: (row) =>
              this.updateInput(
                row as UserTableEntry,
                { key: 'access_email_postbox_access', title: '' },
                !row.data.access_email_postbox_access
              ),
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            action: (groupEntry: UserTableEntry) =>
              this.removeUser(groupEntry.data as UserData),
            title: '',
            icon: 'trash',
            compact: true,
          }
        )
      ),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.groups) {
      this.users$.next(changes.groups.currentValue);
    }
  }

  onAddGroupDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  updateInput(row: UserTableEntry, column: TableColumn, $event: any): void {
    if (
      column.key === 'access_email_allowed_forward' &&
      (this.readOnly || !this.enabledForwarding)
    ) {
      return;
    } else if (
      column.key === 'access_email_forward' &&
      (this.readOnly ||
        !this.enabledForwarding ||
        !row.data.access_email_allowed_forward)
    ) {
      return;
    } else if (
      column.key === 'access_email_postbox_access' &&
      (this.readOnly || !this.enabledPostbox)
    ) {
      return;
    }
    row.data[column.key] = $event;
    this.users[row.data.index][column.key] = $event;
    // Note: Do not next the users$, because nothing changed in that structure.
    this.usersChange.emit(this.users);
    if (this._onTouched) {
      this._onTouched();
    }
    if (this._onChange) {
      this._onChange(this.users);
    }
  }

  onAddUserDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  removeUser(user: UserData) {
    const idx = this.users.findIndex((user2) => user2.user_id === user.user_id);
    if (idx !== -1) {
      this.users = [...this.users];
      this.users.splice(idx, 1);
      this.users$.next(this.users);
      this.usersChange.emit(this.users);
      if (this._onTouched) {
        this._onTouched();
      }
      if (this._onChange) {
        this._onChange(this.users);
      }
    }
  }

  addUserClick(user: UserData) {
    this.users = this.users.concat({
      user_id: user.user_id,
      access_email_allowed_forward: false,
      access_email_forward: false,
      access_email_postbox_access: false,
    });
    this.users$.next(this.users);
    this.usersChange.emit(this.users);
    if (this._onTouched) {
      this._onTouched();
    }
    if (this._onChange) {
      this._onChange(this.users);
    }
  }

  writeValue(value: GroupUserEmailAccess[]): void {
    this.users = value;
    this.users$.next(value);
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.readOnly = isDisabled;
  }
}
