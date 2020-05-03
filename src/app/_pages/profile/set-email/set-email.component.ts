import { Component, OnInit, Input } from '@angular/core';
import { UserPropertyWithValue } from 'src/app/_models/user';
import { ApiService } from 'src/app/_services/api.service';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'app-set-email',
  templateUrl: './set-email.component.html',
  styleUrls: ['./set-email.component.scss'],
})
export class SetEmailComponent {
  @Input() userId: string;
  @Input() emailProperty: UserPropertyWithValue;

  updateValue: Record<string, any> = {};
  valid = true;
  valids: Record<string, boolean> = {};
  saving = false;
  lastError: string;

  get hasChange(): boolean {
    return !!Object.keys(this.updateValue).length;
  }

  constructor(
    private apiService: ApiService,
    private toastr: NbToastrService
  ) {}

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.valid && this.hasChange) {
      this.saving = true;
      this.lastError = null;
      this.apiService
        .updateUser(this.userId, this.updateValue)
        .toPromise()
        .then(
          () => {
            this.toastr.primary(
              'Please check your new e-mail address for a verification link to activate the change.',
              'E-Mail Address Change',
              { duration: 5000 }
            );
            this.updateValue = {};
            this.saving = false;
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

  resendEmailVerification() {
    this.saving = true;
    this.apiService
      .reverifyEmail(this.userId)
      .toPromise()
      .then(
        () => {
          this.saving = false;
          this.toastr.primary(
            'Please check your e-mail for a verification link.',
            'E-Mail Verification',
            { duration: 5000 }
          );
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

  onValueChange(key: string, value: any) {
    this.updateValue[key] = value;
  }

  onValidChange(key: string, valid: boolean) {
    this.valids[key] = valid;
    this.valid = Object.values(this.valids).every((x) => x);
  }
}
