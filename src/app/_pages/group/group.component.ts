import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  Validators,
} from '@angular/forms';
import { GroupsService } from 'src/app/_services/groups.service';
import { takeUntil, map, switchMap, tap, take } from 'rxjs/operators';
import { Subject, Observable, of, combineLatest } from 'rxjs';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService, NbDialogRef, NbDialogService } from '@nebular/theme';
import { GroupWithId, Group } from 'src/app/_models/user_group';
import { GroupUserEmailAccess } from 'src/app/_components/member-users-access/member-users-access.component';

interface EditGroup {
  id: string;
  notes: string;
  group_name: string;
  visible: boolean;
  member_groups: string[];
  enable_email: boolean;
  enable_postbox: boolean;
  postbox_quota: number;
  user_access: GroupUserEmailAccess[];
}

@Component({
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
})
export class GroupComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  groupData: GroupWithId = null;
  groupId: string;

  lastError: string;
  saving = false;
  loading = true;

  private _groupFormElements: Record<keyof EditGroup, FormControl> = {
    id: new FormControl(
      null,
      [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.+-]+$/)],
      [(x) => this.validateFormId(x)]
    ),
    notes: new FormControl(null),
    group_name: new FormControl(null, Validators.required),
    visible: new FormControl(true),
    member_groups: new FormControl([]),
    enable_email: new FormControl(false),
    enable_postbox: new FormControl(false),
    postbox_quota: new FormControl(100000000),
    user_access: new FormControl([]),
  };

  form = new FormGroup(this._groupFormElements);

  get isNew(): boolean {
    return this.groupId === 'new';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  constructor(
    private api: ApiService,
    private groupsService: GroupsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: NbToastrService,
    private dialogService: NbDialogService
  ) {
    this._groupFormElements.enable_email.valueChanges.subscribe(
      (enableEmail) => {
        if (enableEmail) {
          this._groupFormElements.enable_postbox.enable();
          this._groupFormElements.postbox_quota.enable();
        } else {
          this._groupFormElements.enable_postbox.disable();
          this._groupFormElements.postbox_quota.disable();
        }
      }
    );
    combineLatest([
      this._groupFormElements.enable_email.valueChanges,
      this._groupFormElements.enable_postbox.valueChanges,
    ]).subscribe(([enableEmail, enablePostbox]) => {
      if (enableEmail && enablePostbox) {
        this._groupFormElements.postbox_quota.enable();
      } else {
        this._groupFormElements.postbox_quota.disable();
      }
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    const groupId$ = this.route.params.pipe(
      map((params) => params.groupId as string)
    );
    groupId$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((groupId) => (this.groupId = groupId));

    groupId$
      .pipe(
        switchMap((groupId) =>
          groupId !== 'new' ? this.api.getGroup(groupId) : of(null)
        ),
        takeUntil(this.destroyed$)
      )
      .subscribe(
        (groupData: GroupWithId) => {
          this.loading = false;
          if (groupData === null) {
            this.form.reset({
              id: null,
              group_name: null,
              visible: true,
              notes: null,
              member_groups: [],
              enable_email: false,
              enable_postbox: false,
              user_access: [],
            } as EditGroup);
            this.form.get('id').enable();
            this.form.updateValueAndValidity();
          } else {
            this.form.reset({
              ...groupData,
              user_access: groupData.members.map((member) => ({
                user_id: member,
                access_email_allowed_forward: groupData.email_allowed_forward_members.includes(
                  member
                ),
                access_email_forward: groupData.email_forward_members.includes(
                  member
                ),
                access_email_postbox_access: groupData.email_postbox_access_members.includes(
                  member
                ),
              })),
            } as EditGroup);
            this.form.get('id').disable();
            this.form.updateValueAndValidity();
          }
        },
        (err) => {
          this.loading = false;
          this.loading = false;
          if (err?.status === 0) {
            this.toastr.danger(err?.statusText, 'Error');
          } else if (err?.error?.detail) {
            this.toastr.danger(err?.error?.detail, 'Error');
          } else if (err?.error) {
            this.toastr.danger(err?.error, 'Error');
          }
        }
      );
  }

  validateFormId(
    control: AbstractControl
  ): Observable<Record<string, any> | null> {
    return this.groupsService.groupsById$.pipe(
      take(1),
      takeUntil(this.destroyed$),
      map(
        (groupsById) =>
          groupsById.hasOwnProperty(control.value) &&
          control.value !== this.groupId
      ),
      map((groupExists) => (groupExists ? { groupExists: true } : null))
    );
  }

  getFormValue(includeId: true): GroupWithId;
  getFormValue(includeId: false): Group;
  getFormValue(includeId: boolean): GroupWithId | Group {
    const formValue: EditGroup = this.form.value;
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
    };
  }

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (!this.form.valid) {
      return;
    }
    this.saving = true;
    if (this.groupId === 'new') {
      this.api
        .createGroup(this.getFormValue(true))
        .toPromise()
        .then(
          () => {
            this.saving = false;
            this.form.markAsPristine();
            this.groupsService.reload();
            this.router.navigate(['/groups']);
          },
          (err) => {
            this.saving = false;
            if (err?.status === 0) {
              this.toastr.danger(err?.statusText, 'Error');
              this.lastError = err?.statusText;
            } else if (err?.error?.detail) {
              this.toastr.danger(err?.error?.detail, 'Error');
              this.lastError = err?.error?.detail.toString();
            } else if (err?.error) {
              this.toastr.danger(err?.error, 'Error');
              this.lastError = err?.error.toString();
            }
          }
        );
    } else {
      this.api
        .updateGroup(this.groupId, this.getFormValue(false))
        .toPromise()
        .then(
          () => {
            this.saving = false;
            this.form.markAsPristine();
            this.groupsService.reload();
            // this.router.navigate(['/groups']);
          },
          (err) => {
            this.saving = false;
            if (err?.status === 0) {
              this.toastr.danger(err?.statusText, 'Error');
              this.lastError = err?.statusText;
            } else if (err?.error?.detail) {
              this.toastr.danger(err?.error?.detail, 'Error');
              this.lastError = err?.error?.detail.toString();
            } else if (err?.error) {
              this.toastr.danger(err?.error, 'Error');
              this.lastError = err?.error.toString();
            }
          }
        );
    }
  }

  showDeleteGroup(dialog: TemplateRef<any>) {
    this.dialogService.open(dialog);
  }

  deleteGroup(dialog: NbDialogRef<any>) {
    this.saving = true;
    dialog.close();
    this.api
      .deleteGroup(this.groupId)
      .toPromise()
      .then(
        () => {
          this.saving = false;
          this.groupsService.reload();
          this.router.navigate(['/groups']);
        },
        (err) => {
          this.saving = false;
          if (err?.status === 0) {
            this.toastr.danger(err?.statusText, 'Error');
            this.lastError = err?.statusText;
          } else if (err?.error?.detail) {
            this.toastr.danger(err?.error?.detail, 'Error');
            this.lastError = err?.error?.detail.toString();
          } else if (err?.error) {
            this.toastr.danger(err?.error, 'Error');
            this.lastError = err?.error.toString();
          }
        }
      );
  }
}
