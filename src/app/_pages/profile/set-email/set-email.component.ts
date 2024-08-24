import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UserPropertyWithValue, UserViewDataGroup } from 'src/app/_models/user';
import { ApiService } from 'src/app/_services/api.service';
import { NbToastrService } from '@nebular/theme';
import { AuthService } from 'src/app/_services/auth.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-set-email',
  templateUrl: './set-email.component.html',
  styleUrls: ['./set-email.component.scss'],
})
export class SetEmailComponent implements OnChanges {
  @Input() userId: string;
  @Input() isActive: boolean;
  @Input() propertyGroup: UserViewDataGroup;

  emailProperty: UserPropertyWithValue;
  emailVerifiedProperty: UserPropertyWithValue;
  emailForwardProperty: UserPropertyWithValue;
  hasEmailAliasProperty: UserPropertyWithValue;
  emailAliasProperty: UserPropertyWithValue;

  updateValue: Record<string, any> = {};
  valid = true;
  valids: Record<string, boolean> = {};
  saving = false;
  lastError: string;

  get isSelf(): boolean {
    return this.authService.isSelf(this.userId);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get hasChange(): boolean {
    return !!Object.keys(this.updateValue).length;
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: NbToastrService,
    private clipboard: Clipboard
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.propertyGroup) {
      if (this.propertyGroup) {
        const propsByKey: Record<string, UserPropertyWithValue> =
          this.propertyGroup.properties.reduce((o, prop) => {
            o[prop.key] = prop;
            return o;
          }, {});
        this.emailProperty = propsByKey.email;
        this.emailVerifiedProperty = propsByKey.email_verified;
        this.emailForwardProperty = propsByKey.forward_emails;
        this.hasEmailAliasProperty = propsByKey.has_email_alias;
        this.emailAliasProperty = propsByKey.email_alias;
      } else {
        this.emailProperty = null;
        this.emailVerifiedProperty = null;
        this.emailForwardProperty = null;
        this.hasEmailAliasProperty = null;
        this.emailAliasProperty = null;
      }
    }
  }

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
          (updateResult) => {
            if (this.updateValue[this.emailProperty.key]) {
              if (this.isSelf) {
                this.toastr.success(
                  'Please check your new e-mail address for a verification link to activate the change.',
                  'E-Mail Address Change',
                  { duration: 5000 }
                );
              }
            }
            this.updateValue = {};
            this.saving = false;
            if (updateResult.link) {
              if (this.clipboard.copy(updateResult.link)) {
                this.toastr.success(
                  'Sent e-mail activation link to user and copied link to clipboard.',
                  'E-Mail Activation'
                );
              } else {
                this.toastr.warning(
                  'Sent e-mail activation link to user, but could not copy link to clipboard. Next block contains the link, copy manually!',
                  'E-Mail Activation'
                );
                this.toastr.show(updateResult.link, 'E-Mail Activation', {
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
        (updateResult) => {
          this.saving = false;
          if (this.isSelf) {
            this.toastr.success(
              'Please check your e-mail for a verification link.',
              'E-Mail Verification',
              { duration: 5000 }
            );
          } else {
            this.toastr.success(
              'E-mail with verification link was sent to the user.',
              'E-Mail Verification',
              { duration: 5000 }
            );
          }
          if (updateResult.link) {
            if (this.clipboard.copy(updateResult.link)) {
              this.toastr.success(
                'Sent e-mail activation link to user and copied link to clipboard.',
                'E-Mail Activation'
              );
            } else {
              this.toastr.warning(
                'Sent e-mail activation link to user, but could not copy link to clipboard. Next block contains the link, copy manually!',
                'E-Mail Activation'
              );
              this.toastr.show(updateResult.link, 'E-Mail Activation', {
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
        }
      );
  }

  resendEmailRegistration() {
    this.saving = true;
    this.apiService
      .resendRegistration(this.userId)
      .toPromise()
      .then(
        (updateResult) => {
          this.saving = false;
          this.toastr.success(
            'Sent registration form to user for (re-)registration.',
            '(Re-)Registration',
            { duration: 5000 }
          );
          if (updateResult.link) {
            if (this.clipboard.copy(updateResult.link)) {
              this.toastr.success(
                'Sent e-mail activation link to user and copied link to clipboard.',
                'E-Mail Activation'
              );
            } else {
              this.toastr.warning(
                'Sent e-mail activation link to user, but could not copy link to clipboard. Next block contains the link, copy manually!',
                'E-Mail Activation'
              );
              this.toastr.show(updateResult.link, 'E-Mail Activation', {
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
