import { Validators } from '@angular/forms';
import { combineLatest, EMPTY, Observable } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import {
  GroupInCreate,
  GroupInList,
  GroupInRead,
  GroupInWrite,
} from '../_models/group';
import { UserListViewData } from '../_models/user';
import {
  TypedFormArray,
  TypedFormControl,
  TypedFormGroup,
} from './typed-forms';

export interface GroupUserEmailAccess {
  user_id: string;
  access_email_allowed_forward: boolean;
  access_email_forward: boolean;
  access_email_postbox_access: boolean;
  access_email_mailing_list_notify: boolean;
}

export class GroupUserEmailAccessFormGroup extends TypedFormGroup<
  GroupUserEmailAccess,
  {
    user_id: TypedFormControl<string>;
    access_email_allowed_forward: TypedFormControl<boolean>;
    access_email_forward: TypedFormControl<boolean>;
    access_email_postbox_access: TypedFormControl<boolean>;
    access_email_mailing_list_notify: TypedFormControl<boolean>;
  }
> {
  public readonly user$: Observable<UserListViewData>;

  get user_id(): string {
    return this.controls.user_id.value;
  }

  constructor(
    access: GroupUserEmailAccess,
    usersById$: Observable<Record<string, UserListViewData>>
  ) {
    super({
      user_id: new TypedFormControl(access.user_id),
      access_email_allowed_forward: new TypedFormControl(
        access.access_email_allowed_forward
      ),
      access_email_forward: new TypedFormControl(access.access_email_forward),
      access_email_postbox_access: new TypedFormControl(
        access.access_email_postbox_access
      ),
      access_email_mailing_list_notify: new TypedFormControl(
        access.access_email_mailing_list_notify
      ),
    });

    this.controls.access_email_allowed_forward.value$
      .pipe(delay(0))
      .subscribe((allowEmailForward) => {
        if (allowEmailForward) {
          this.controls.access_email_forward.enable();
        } else {
          this.controls.access_email_forward.disable();
        }
      });

    this.user$ = combineLatest([usersById$, this.controls.user_id.value$]).pipe(
      map(([usersById, userId]) => usersById[userId])
    );

    this.parent$
      .pipe(
        switchMap(
          (parent) =>
            (parent as GroupUserEmailAccessFormArray)?.parent$ ?? EMPTY
        ),
        switchMap(
          (parent) =>
            (parent as UserGroupForm)?.onChange([
              'enable_email',
              'enable_postbox',
              'email_managed_mailing_list',
            ]) ?? EMPTY
        )
      )
      .subscribe(
        ({ enable_email, enable_postbox, email_managed_mailing_list }) => {
          if (enable_email) {
            this.controls.access_email_allowed_forward.enable();
          } else {
            this.controls.access_email_allowed_forward.disable();
            if (this.controls.access_email_allowed_forward.value) {
              this.controls.access_email_allowed_forward.setValue(false);
            }
          }
          if (
            enable_email &&
            this.controls.access_email_allowed_forward.value
          ) {
            this.controls.access_email_forward.enable();
          } else {
            this.controls.access_email_forward.disable();
            if (this.controls.access_email_forward.value) {
              this.controls.access_email_forward.setValue(false);
            }
          }
          if (enable_postbox) {
            this.controls.access_email_postbox_access.enable();
          } else {
            this.controls.access_email_postbox_access.disable();
            if (this.controls.access_email_postbox_access.value) {
              this.controls.access_email_postbox_access.setValue(false);
            }
          }
          if (email_managed_mailing_list) {
            this.controls.access_email_mailing_list_notify.enable();
          } else {
            this.controls.access_email_mailing_list_notify.disable();
            if (this.controls.access_email_mailing_list_notify.value) {
              this.controls.access_email_mailing_list_notify.setValue(false);
            }
          }
        }
      );
  }
}

export class GroupUserEmailAccessFormArray extends TypedFormArray<
  GroupUserEmailAccess,
  GroupUserEmailAccessFormGroup[]
> {
  constructor(
    access: GroupUserEmailAccess[],
    usersById$: Observable<Record<string, UserListViewData>>
  ) {
    super(
      access.map((acc) => new GroupUserEmailAccessFormGroup(acc, usersById$))
    );
  }
}

export class MemberGroupFormControl extends TypedFormControl<string> {
  public readonly group$: Observable<GroupInList>;

  constructor(
    groupsById$: Observable<Record<string, GroupInList>>,
    groupId?: string
  ) {
    super(groupId ?? null);
    this.group$ = combineLatest([this.value$, groupsById$]).pipe(
      map(([currentGroupId, groupsById]) => groupsById[currentGroupId])
    );
  }
}

export class MembersFormArray extends TypedFormArray<
  string,
  MemberGroupFormControl[]
> {
  constructor(
    private groupsById$: Observable<Record<string, GroupInList>>,
    properties: string[]
  ) {
    super(
      properties.map(
        (property) => new MemberGroupFormControl(groupsById$, property)
      )
    );
  }

  add(groupId: string) {
    super.push(new MemberGroupFormControl(this.groupsById$, groupId));
  }

  push(control?: TypedFormControl<string>) {
    super.push(control ?? new MemberGroupFormControl(this.groupsById$, ''));
  }
}

export interface UserGroupEditData {
  id: string;
  group_name: string;
  group_type: string;
  notes?: string;

  visible: boolean;

  member_groups: string[];

  enable_email: boolean;
  enable_postbox: boolean;
  postbox_quota: number;

  email_managed_mailing_list: boolean;
  email_managed_mailing_list_forward_to_notifiers: boolean;
  email_managed_mailing_list_send_notification_to_sender: boolean;

  user_access: GroupUserEmailAccess[];
}

export class UserGroupForm extends TypedFormGroup<
  UserGroupEditData,
  {
    id: TypedFormControl<string>;
    group_name: TypedFormControl<string>;
    group_type: TypedFormControl<string>;
    notes: TypedFormControl<string>;

    visible: TypedFormControl<boolean>;

    member_groups: MembersFormArray;

    enable_email: TypedFormControl<boolean>;
    enable_postbox: TypedFormControl<boolean>;
    postbox_quota: TypedFormControl<number>;

    email_managed_mailing_list: TypedFormControl<boolean>;
    email_managed_mailing_list_forward_to_notifiers: TypedFormControl<boolean>;
    email_managed_mailing_list_send_notification_to_sender: TypedFormControl<boolean>;

    user_access: GroupUserEmailAccessFormArray;
  }
> {
  constructor(
    usersById$: Observable<Record<string, UserListViewData>>,
    groupsById$: Observable<Record<string, GroupInList>>,
    group?: GroupInRead,
    validateFormId?
  ) {
    super({
      id: new TypedFormControl(
        group?.id ?? '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.+-]+$/)],
        validateFormId
      ),
      group_name: new TypedFormControl(
        group?.group_name ?? '',
        Validators.required
      ),
      group_type: new TypedFormControl(
        group?.group_type ?? '',
        Validators.required
      ),
      notes: new TypedFormControl(group?.notes ?? ''),

      visible: new TypedFormControl(group?.visible ?? true),

      member_groups: new MembersFormArray(
        groupsById$,
        group?.member_groups ?? []
      ),

      enable_email: new TypedFormControl(group?.enable_email ?? false),
      enable_postbox: new TypedFormControl(group?.enable_postbox ?? false),
      postbox_quota: new TypedFormControl(group?.postbox_quota ?? 100000000),

      email_managed_mailing_list: new TypedFormControl(
        group?.email_managed_mailing_list ?? false
      ),
      email_managed_mailing_list_forward_to_notifiers: new TypedFormControl(
        group?.email_managed_mailing_list_forward_to_notifiers ?? false
      ),
      email_managed_mailing_list_send_notification_to_sender: new TypedFormControl(
        group?.email_managed_mailing_list_send_notification_to_sender ?? false
      ),

      user_access: new GroupUserEmailAccessFormArray(
        group?.members.map((member) => ({
          user_id: member,
          access_email_allowed_forward: group.email_allowed_forward_members.includes(
            member
          ),
          access_email_forward: group.email_forward_members.includes(member),
          access_email_postbox_access: group.email_postbox_access_members.includes(
            member
          ),
          access_email_mailing_list_notify: group.email_managed_mailing_list_notify_members.includes(
            member
          ),
        })) ?? [],
        usersById$
      ),
    });

    this.controls.enable_email.value$
      .pipe(delay(0))
      .subscribe((enableEmail) => {
        if (enableEmail) {
          this.controls.enable_postbox.enable();
          this.controls.email_managed_mailing_list.enable();
        } else {
          this.controls.enable_postbox.disable();
          this.controls.email_managed_mailing_list.disable();
          if (this.controls.enable_postbox.value) {
            this.controls.enable_postbox.setValue(false);
          }
          if (this.controls.email_managed_mailing_list.value) {
            this.controls.email_managed_mailing_list.setValue(false);
          }
        }
      });

    combineLatest([
      this.controls.enable_email.value$,
      this.controls.enable_postbox.value$,
      this.controls.email_managed_mailing_list.value$,
    ])
      .pipe(delay(0))
      .subscribe(([enableEmail, enablePostbox, enableMailingList]) => {
        if (enableEmail && enablePostbox) {
          this.controls.postbox_quota.enable();
        } else {
          this.controls.postbox_quota.disable();
        }
        if (enableEmail && enableMailingList) {
          this.controls.email_managed_mailing_list_forward_to_notifiers.enable();
          this.controls.email_managed_mailing_list_send_notification_to_sender.enable();
        } else {
          this.controls.email_managed_mailing_list_forward_to_notifiers.disable();
          this.controls.email_managed_mailing_list_send_notification_to_sender.disable();
          if (
            this.controls.email_managed_mailing_list_forward_to_notifiers.value
          ) {
            this.controls.email_managed_mailing_list_forward_to_notifiers.setValue(
              false
            );
          }
          if (
            this.controls.email_managed_mailing_list_send_notification_to_sender
              .value
          ) {
            this.controls.email_managed_mailing_list_send_notification_to_sender.setValue(
              false
            );
          }
        }
      });
  }

  getRawValue(): GroupInWrite;
  getRawValue(includeId: true): GroupInCreate;
  getRawValue(includeId?: boolean): GroupInWrite | GroupInCreate {
    const formValue: UserGroupEditData & {
      user_access: GroupUserEmailAccess[];
      id: string;
    } = super.getRawValue();
    const userAccess = formValue.user_access;
    console.log(userAccess);
    delete formValue.user_access;
    if (!includeId) {
      delete formValue.id;
    }
    return {
      ...formValue,
      members: userAccess.map((ua) => ua.user_id),
      email_allowed_forward_members: userAccess
        .filter((ua) => ua.access_email_allowed_forward)
        .map((ua) => ua.user_id),
      email_forward_members: userAccess
        .filter((ua) => ua.access_email_forward)
        .map((ua) => ua.user_id),
      email_postbox_access_members: userAccess
        .filter((ua) => ua.access_email_postbox_access)
        .map((ua) => ua.user_id),
      email_managed_mailing_list_notify_members: userAccess
        .filter((ua) => ua.access_email_mailing_list_notify)
        .map((ua) => ua.user_id),
    };
  }
}
