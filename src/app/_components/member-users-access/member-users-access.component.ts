import {
  Component,
  Input,
  TemplateRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  TableColumn,
  ITableEntry,
} from 'src/app/_components/table/table.component';
import { UsersService } from 'src/app/_services/users.service';
import {
  GroupUserEmailAccessFormArray,
  GroupUserEmailAccessFormGroup,
} from 'src/app/_forms/user-group-form';
import { UserListViewData } from 'src/app/_models/user';

declare type UserTableEntry = ITableEntry<GroupUserEmailAccessFormGroup>;

@Component({
  selector: 'app-member-users-access',
  templateUrl: './member-users-access.component.html',
  styleUrls: ['./member-users-access.component.scss'],
})
export class MemberUsersAccessComponent implements OnInit {
  @Input() accessFormArray: GroupUserEmailAccessFormArray;
  @Input() enabledForwarding: boolean;
  @Input() enabledPostbox: boolean;
  @Input() enabledMailingList: boolean;

  @ViewChild('emailAllowedForwardCheckbox', { static: true })
  emailAllowedForwardCheckbox: TemplateRef<any>;
  @ViewChild('emailForwardCheckbox', { static: true })
  emailForwardCheckbox: TemplateRef<any>;
  @ViewChild('emailPostboxAccessCheckbox', { static: true })
  emailPostboxAccessCheckbox: TemplateRef<any>;
  @ViewChild('emailMailingListNotifyCheckbox', { static: true })
  emailMailingListNotifyCheckbox: TemplateRef<any>;

  columnsAdd$: Observable<TableColumn[]>;
  columnsView$: Observable<TableColumn[]>;
  columnsEdit$: Observable<TableColumn[]>;

  allUsersData$ = this.usersService.resolvedUsers$;

  constructor(private usersService: UsersService) {}

  idControl = (control: GroupUserEmailAccessFormGroup) => control.user_id;
  idAllData = (data: UserListViewData) => data.user_id;

  ngOnInit(): void {
    this.columnsAdd$ = this.usersService.properties$.pipe(
      map((properties) =>
        properties.filter((prop) => prop.visible).map((prop) => ({ ...prop }))
      ),
      shareReplay(1)
    );
    this.columnsView$ = this.usersService.properties$.pipe(
      map((properties) =>
        properties
          .filter((prop) => prop.visible)
          .map((prop) => ({ ...prop, clickableCells: true }))
      ),
      shareReplay(1)
    );
    this.columnsEdit$ = this.usersService.properties$.pipe(
      map((properties) => properties.filter((prop) => prop.visible)),
      map((userColumns) =>
        userColumns.map(
          (userColumn) =>
            ({
              key: userColumn.key,
              title: userColumn.title,
              value$: (row: UserTableEntry) =>
                row.data.user$.pipe(
                  map(
                    (user) =>
                      user.properties.find((x) => x.key === userColumn.key)
                        ?.value
                  )
                ),
            } as TableColumn)
        )
      ),
      map((columns) =>
        columns.concat(
          {
            key: 'access_email_allowed_forward',
            title: 'Allow Forward E-Mail',
            templateRef: this.emailAllowedForwardCheckbox,
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            key: 'access_email_forward',
            title: 'Forward E-Mail',
            templateRef: this.emailForwardCheckbox,
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            key: 'access_email_postbox_access',
            title: 'Access Postbox',
            templateRef: this.emailPostboxAccessCheckbox,
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            key: 'access_email_mailing_list_notify',
            title: 'Mailing List Notify',
            templateRef: this.emailMailingListNotifyCheckbox,
            compact2: true,
            centerCells: true,
          } as TableColumn,
          {
            action: (groupEntry: UserTableEntry) =>
              this.removeUser(groupEntry.data as GroupUserEmailAccessFormGroup),
            title: '',
            icon: 'trash',
            compact: true,
          }
        )
      ),
      shareReplay(1)
    );
  }

  removeUser(user: GroupUserEmailAccessFormGroup) {
    const idx = this.accessFormArray.controls.findIndex(
      (user2) => user2.controls.user_id === user.controls.user_id
    );
    if (idx !== -1) {
      this.accessFormArray.removeAt(idx);
      this.accessFormArray.markAsDirty();
      this.accessFormArray.updateValueAndValidity();
    }
  }

  addUser(user: UserListViewData) {
    this.accessFormArray.push(
      new GroupUserEmailAccessFormGroup(
        {
          user_id: user.user_id,
          access_email_allowed_forward: false,
          access_email_forward: false,
          access_email_postbox_access: false,
          access_email_mailing_list_notify: false,
        },
        this.usersService.usersById$
      )
    );
    this.accessFormArray.markAsDirty();
    this.accessFormArray.updateValueAndValidity();
  }
}
