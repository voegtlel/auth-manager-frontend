import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  Validators,
} from '@angular/forms';
import { GroupsService } from 'src/app/_services/groups.service';
import { takeUntil, map, switchMap, tap, take } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService, NbDialogRef, NbDialogService } from '@nebular/theme';
import { GroupWithId } from 'src/app/_models/user_group';

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

  private _groupFormElements: Record<keyof GroupWithId, FormControl> = {
    id: new FormControl(
      null,
      [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.+-]+$/)],
      [(x) => this.validateFormId(x)]
    ),
    notes: new FormControl(null),
    group_name: new FormControl(null, Validators.required),
    visible: new FormControl(true),
    member_groups: new FormControl([]),
    members: new FormControl([]),
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
  ) {}

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
        (groupData) => {
          this.loading = false;
          if (groupData === null) {
            this.form.reset({
              id: null,
              group_name: null,
              visible: true,
              member_groups: [],
              members: [],
            });
            this.form.get('id').enable();
            this.form.updateValueAndValidity();
          } else {
            this.form.reset(groupData);
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

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (!this.form.valid) {
      return;
    }
    this.saving = true;
    const formValue: GroupWithId = this.form.value;
    if (this.groupId === 'new') {
      this.api
        .createGroup(formValue)
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
        .updateGroup(this.groupId, {
          group_name: formValue.group_name,
          notes: formValue.notes,
          visible: formValue.visible,
          member_groups: formValue.member_groups,
          members: formValue.members,
        })
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
