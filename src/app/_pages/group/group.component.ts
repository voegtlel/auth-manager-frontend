import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { GroupsService } from 'src/app/_services/groups.service';
import { takeUntil, map, switchMap, take } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService, NbDialogRef, NbDialogService } from '@nebular/theme';
import { GroupInRead } from 'src/app/_models/group';
import { UserGroupForm } from 'src/app/_forms/user-group-form';
import { SchemaService } from 'src/app/_services/schema.service';
import { UsersService } from 'src/app/_services/users.service';

@Component({
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
})
export class GroupComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  groupData: GroupInRead = null;
  groupId: string;

  lastError: string;
  saving = false;
  loading = true;

  form = new UserGroupForm(
    this.usersService.usersById$,
    this.groupsService.groupsById$,
    null,
    [(x) => this.validateFormId(x)]
  );

  groups$ = this.schemaService.schema$.pipe(map((schema) => schema.groupTypes));

  get isNew(): boolean {
    return this.groupId === 'new';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  constructor(
    private api: ApiService,
    private groupsService: GroupsService,
    private schemaService: SchemaService,
    private authService: AuthService,
    private usersService: UsersService,
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
        (groupData: GroupInRead) => {
          this.loading = false;
          if (groupData === null) {
            this.form = new UserGroupForm(
              this.usersService.usersById$,
              this.groupsService.groupsById$,
              null,
              [(x) => this.validateFormId(x)]
            );
            this.form.controls.id.enable();
            this.form.updateValueAndValidity();
          } else {
            this.form = new UserGroupForm(
              this.usersService.usersById$,
              this.groupsService.groupsById$,
              groupData,
              [(x) => this.validateFormId(x)]
            );
            this.form.controls.id.disable();
            this.form.updateValueAndValidity();
          }
        },
        (err) => {
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
    if (this.groupId === 'new') {
      this.api
        .createGroup(this.form.getRawValue(true))
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
        .updateGroup(this.groupId, this.form.getRawValue())
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
