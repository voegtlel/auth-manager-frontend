import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { GroupsService } from 'src/app/_services/groups.service';
import { takeUntil, map, switchMap, take } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { UserViewInRead, UserViewInWrite } from 'src/app/_models/user_view';
import { UserViewForm } from 'src/app/_forms/user-view-form';

@Component({
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
})
export class UserViewComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  userView: UserViewInRead = null;
  userViewId: string;

  lastError: string;
  saving = false;
  loading = true;

  form = new UserViewForm();

  get isNew(): boolean {
    return this.userViewId === 'new';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  constructor(
    private api: ApiService,
    private groupsService: GroupsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    const userViewId$ = this.route.params.pipe(
      map((params) => params.userViewId as string)
    );
    userViewId$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((userViewId) => (this.userViewId = userViewId));

    userViewId$
      .pipe(
        switchMap((userViewId) =>
          userViewId !== 'new' ? this.api.getUserView(userViewId) : of(null)
        ),
        takeUntil(this.destroyed$)
      )
      .subscribe(
        (userViewData: UserViewInRead) => {
          this.loading = false;
          if (userViewData === null) {
            this.form = new UserViewForm();
            this.form.get('id').enable();
            this.form.updateValueAndValidity();
          } else {
            this.form = new UserViewForm(userViewData);
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
          control.value !== this.userViewId
      ),
      map((groupExists) => (groupExists ? { groupExists: true } : null))
    );
  }

  getFormValue(): UserViewInWrite {
    return this.form.value;
  }

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (!this.form.valid) {
      return;
    }
    this.saving = true;
    if (this.userViewId === 'new') {
      throw new Error('Cannot create new view. Create a group instead.');
    } else {
      this.api
        .updateUserView(this.userViewId, this.getFormValue())
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
}
