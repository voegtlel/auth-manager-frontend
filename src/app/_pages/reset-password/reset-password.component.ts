import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetToken: string;
  newPassword = '';
  repeatPassword = '';

  destroyed$ = new Subject<void>();

  saving = false;
  saved = false;
  lastError: string;
  lastErrorPassword: string;

  get hasErrorLength(): boolean {
    return this.newPassword && this.newPassword.length < 8;
  }

  get hasErrorMatch(): boolean {
    return this.repeatPassword && this.newPassword !== this.repeatPassword;
  }

  get isValid(): boolean {
    return (
      !!this.newPassword &&
      !this.hasErrorLength &&
      !this.hasErrorMatch &&
      !!this.repeatPassword
    );
  }

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(map((params) => params.token))
      .subscribe((resetToken) => (this.resetToken = resetToken));
  }

  submit($event) {
    $event.stopPropagation();
    $event.preventDefault();
    if (this.isValid) {
      this.saving = true;
      this.lastErrorPassword = this.newPassword;
      this.lastError = null;
      this.api
        .resetPassword(this.resetToken, this.newPassword)
        .toPromise()
        .then(
          () => {
            this.saving = false;
            this.newPassword = '';
            this.repeatPassword = '';
            this.lastError = '';
            this.lastErrorPassword = '';
            this.saved = true;
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
            console.log(err);
          }
        );
    }
  }
}
