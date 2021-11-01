import {
  Component,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import {
  UserPasswordAccessToken,
  UserPropertyWithValue,
} from 'src/app/_models/user';

interface AccessTokenEntry extends UserPasswordAccessToken {
  index: number;
}

interface AccessTokenTableEntry extends TableEntry {
  data: AccessTokenEntry;
}

@Component({
  selector: 'app-access-tokens',
  templateUrl: './access-tokens.component.html',
  styleUrls: ['./access-tokens.component.scss'],
})
export class AccessTokensComponent implements OnInit, OnDestroy, OnChanges {
  @Input() accessTokens: UserPasswordAccessToken[] = [];
  @Output() accessTokensChange = new EventEmitter<UserPasswordAccessToken[]>();
  @Input() readOnly = false;
  @Input() isAdmin: boolean;
  @Input() isSelf: boolean;

  readonly descriptionProperty: UserPropertyWithValue = {
    key: 'description',
    title: 'Description',
    type: 'str',
    value: '',
    can_edit: 'everybody',
    can_read: 'everybody',
    visible: 'everybody',
    default: '',
    format: null,
    format_help: null,
    required: true,
    template: null,
    values: null,
    write_once: false,
  };

  readonly tokenProperty: UserPropertyWithValue = {
    key: 'token',
    title: 'Token',
    type: 'token',
    value: '',
    can_edit: 'everybody',
    can_read: 'nobody',
    visible: 'everybody',
    default: '',
    format: null,
    format_help: null,
    required: true,
    template: null,
    values: null,
    write_once: false,
  };

  createToken: string;
  createDescription: string;

  readOnly$ = new BehaviorSubject<boolean>(true);
  accessTokens$ = new BehaviorSubject<UserPasswordAccessToken[]>(null);

  destroyed$ = new Subject<void>();

  accessTokensData$: Observable<AccessTokenTableEntry[]>;

  columnsView: TableColumn[] = [
    { key: 'description', title: 'Description', clickableCells: true },
    { key: 'token', title: 'Token', clickableCells: true },
  ];

  columnsEdit: TableColumn[] = [
    ...this.columnsView,
    {
      key: '_remove',
      action: (groupEntry: AccessTokenTableEntry) =>
        this.removeAccessToken(groupEntry.data as AccessTokenEntry),
      title: '',
      icon: 'trash',
      compact: true,
      centerCells: true,
    } as TableColumn,
  ];

  lastError: string;

  constructor(private dialogService: NbDialogService) {
    this.accessTokensData$ = this.accessTokens$.pipe(
      map((accessTokens) =>
        (accessTokens ?? []).map((accessToken, index) => ({
          data: { ...accessToken, index },
        }))
      )
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.accessTokens) {
      if (this.accessTokens == null) {
        this.accessTokens = [];
      }
      this.accessTokens$.next(changes.accessTokens.currentValue);
    }
    if (changes.readOnly) {
      this.readOnly$.next(changes.readOnly.currentValue);
    }
  }

  onAddAccessTokenDialog(dialogRef: TemplateRef<any>) {
    this.createDescription = null;
    this.createToken = null;
    this.dialogService.open(dialogRef);
  }

  removeAccessToken(accessToken: AccessTokenEntry) {
    this.accessTokens = this.accessTokens
      .slice(0, accessToken.index)
      .concat(this.accessTokens.slice(accessToken.index + 1));
    this.accessTokens$.next(this.accessTokens);
    this.accessTokensChange.emit(this.accessTokens);
  }

  addAccessTokenSubmit($event, dialogRef) {
    $event.preventDefault();
    $event.stopPropagation();
    if (!this.createToken || !this.createDescription) {
      return;
    }
    dialogRef.close();
    this.accessTokens = this.accessTokens.concat({
      token: this.createToken,
      description: this.createDescription,
    });
    this.accessTokens$.next(this.accessTokens);
    this.accessTokensChange.emit(this.accessTokens);
  }
}
