import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/_services/auth.service';
import { ApiService } from 'src/app/_services/api.service';
import { NbToastrService } from '@nebular/theme';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss'],
})
export class SetPasswordComponent {
  oldPassword = '';
  newPassword = '';
  repeatPassword = '';
  @Input() userId: string;
  @Input() isActive: boolean;

  lastErrorPassword: string;
  lastError: string;
  saving = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isSelf(): boolean {
    return this.authService.isSelf(this.userId);
  }

  get hasErrorLength(): boolean {
    return this.newPassword && this.newPassword.length < 8;
  }

  get hasErrorMatch(): boolean {
    return (
      this.isSelf &&
      this.repeatPassword &&
      this.newPassword !== this.repeatPassword
    );
  }

  get isValid(): boolean {
    return (
      (!this.isSelf || !!this.oldPassword) &&
      this.newPassword &&
      !this.hasErrorLength &&
      !this.hasErrorMatch &&
      (!this.isSelf || !!this.repeatPassword)
    );
  }

  constructor(
    public apiService: ApiService,
    public authService: AuthService,
    private toastr: NbToastrService,
    private clipboard: Clipboard
  ) {}

  submitPassword($event) {
    $event.stopPropagation();
    $event.preventDefault();
    if (this.isValid) {
      this.saving = true;
      this.lastErrorPassword = this.newPassword;
      this.lastError = null;
      const updateData: { password: string; old_password?: string } = {
        password: this.newPassword,
      };
      if (this.isSelf) {
        updateData.old_password = this.oldPassword;
      }
      this.apiService
        .updateUser(this.userId, updateData)
        .toPromise()
        .then(
          () => {
            this.saving = false;
            this.newPassword = '';
            this.oldPassword = '';
            this.repeatPassword = '';
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

  sendPasswordLink() {
    this.saving = true;
    this.apiService
      .requestResetUserPassword(this.userId)
      .toPromise()
      .then(
        (updateResult) => {
          this.saving = false;
          if (updateResult.link) {
            if (this.clipboard.copy(updateResult.link)) {
              this.toastr.success(
                'Sent password reset link to user and copied password reset link to clipboard.',
                'Password Reset'
              );
            } else {
              this.toastr.warning(
                'Sent password reset link to user, but could not copy password reset link to clipboard. Next block contains the reset link, copy manually!',
                'Password Reset'
              );
              this.toastr.show(updateResult.link, 'Password Reset', {
                destroyByClick: false,
                duration: 60000,
                status: 'warning',
              });
            }
          }
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
