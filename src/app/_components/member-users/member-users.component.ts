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
import { takeUntil, map, filter, tap } from 'rxjs/operators';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UsersService } from 'src/app/_services/users.service';

interface UserData {
  user_id: string;
  [key: string]: any;
}

@Component({
  selector: 'app-member-users',
  templateUrl: './member-users.component.html',
  styleUrls: ['./member-users.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberUsersComponent),
      multi: true,
    },
  ],
})
export class MemberUsersComponent
  implements OnDestroy, OnChanges, ControlValueAccessor {
  @Input() users: string[];
  @Input() readOnly = false;
  @Output() usersChange = new EventEmitter<string[]>();
  @Input() excludeUsers: string[] = [];

  destroyed$ = new Subject<void>();

  users$ = new BehaviorSubject<string[]>(null);

  allUsersData$: Observable<TableEntry[]>;

  usersData$: Observable<TableEntry[]>;

  columnsView$: Observable<TableColumn[]>;
  columnsEdit$: Observable<TableColumn[]>;

  loading = true;
  lastError: string;
  _onChange: (users: string[]) => void;
  _onTouched: () => void;

  constructor(
    private usersService: UsersService,
    private dialogService: NbDialogService
  ) {
    this.usersService.users$.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      this.loading = false;
    });
    const users$ = combineLatest([
      this.users$.pipe(filter((g) => !!g)),
      this.usersService.usersById$,
    ]).pipe(
      map(([users, usersById]) => users.map((userUser) => usersById[userUser]))
    );
    this.usersData$ = users$.pipe(
      map((users) =>
        users.map((user) => ({
          data: user.properties.reduce(
            (o, v) => {
              o[v.key] = v.value;
              return o;
            },
            { user_id: user.user_id }
          ),
        }))
      )
    );
    this.allUsersData$ = combineLatest([
      this.users$.pipe(filter((g) => !!g)),
      this.usersService.users$.pipe(takeUntil(this.destroyed$)),
    ]).pipe(
      map(([users, allUsers]) =>
        allUsers.filter(
          (user) =>
            !users.includes(user.user_id) &&
            !this.excludeUsers.includes(user.user_id)
        )
      ),
      map((users) =>
        users.map((user) => ({
          data: user.properties.reduce(
            (o, v) => {
              o[v.key] = v.value;
              return o;
            },
            { user_id: user.user_id }
          ),
        }))
      )
    );
    this.columnsView$ = this.usersService.properties$;
    this.columnsEdit$ = this.columnsView$.pipe(
      map((columns) =>
        columns.concat({
          action: (userEntry: TableEntry) =>
            this.removeUser(userEntry.data as UserData),
          title: '',
          icon: 'trash',
          compact: true,
        })
      )
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.users) {
      this.users$.next(changes.users.currentValue);
    }
  }

  onAddUserDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  removeUser(user: UserData) {
    const idx = this.users.indexOf(user.user_id);
    if (idx !== -1) {
      this.users = this.users.slice(0, idx).concat(this.users.slice(idx + 1));
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
    this.users = this.users.concat(user.user_id);
    this.users$.next(this.users);
    this.usersChange.emit(this.users);
    if (this._onTouched) {
      this._onTouched();
    }
    if (this._onChange) {
      this._onChange(this.users);
    }
  }

  writeValue(value: string[]): void {
    this.users = value;
    this.users$.next(value);
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
