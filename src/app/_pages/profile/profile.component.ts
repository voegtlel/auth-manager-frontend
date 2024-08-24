import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { combineLatest, of, Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { UserPropertyWithValue, UserViewData } from 'src/app/_models/user';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';
import { UsersService } from 'src/app/_services/users.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  profileData: UserViewData = null;
  propertiesByKey: Record<string, UserPropertyWithValue> = null;
  userId: string;
  registrationToken: string;

  lastError: string;
  updateValues: Record<string, any> = {};
  sendRegistrationLink = true;
  valid = true;
  valids: Record<string, boolean> = {};
  activeProperty: UserPropertyWithValue;
  saving = false;
  loading = true;

  returnUrl: string = null;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: NbToastrService,
    private dialogService: NbDialogService,
    private usersService: UsersService,
    private changeDetector: ChangeDetectorRef,
    private clipboard: Clipboard
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (queryParams) => (this.returnUrl = queryParams.get('return_url'))
      );
    const userId$ = this.route.params.pipe(
      switchMap((params) =>
        params.userId
          ? of(params.userId)
          : params.registrationToken
          ? of(null)
          : this.authService.user$
              .pipe(filter((user) => !!user))
              .pipe(map((user) => user.sub))
      )
    );
    const registrationToken$ = this.route.params.pipe(
      map((params) => params.registrationToken)
    );
    userId$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((userId) => (this.userId = userId));
    registrationToken$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((token) => (this.registrationToken = token));

    combineLatest([userId$, registrationToken$])
      .pipe(
        switchMap(([userId, registrationToken]) =>
          userId
            ? this.api.getUser(userId)
            : this.api.getUserRegistration(registrationToken)
        )
      )
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (profileData) => {
          this.loading = false;
          this.profileData = profileData;
          console.log('Loaded Profile:', profileData);
          this.propertiesByKey = profileData.view_groups.reduce(
            (o, propertyGroup) => {
              for (const prop of propertyGroup.properties) {
                o[prop.key] = prop;
              }
              return o;
            },
            {}
          );
          this.activeProperty = this.propertiesByKey.active;
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

  get isNew(): boolean {
    return this.userId === 'new';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin && !this.registrationToken;
  }

  get isSelf(): boolean {
    return !!this.registrationToken || this.authService.isSelf(this.userId);
  }

  get hasChange(): boolean {
    return !!Object.keys(this.updateValues).length;
  }

  onValueChange(key: string, value: any) {
    this.updateValues[key] = value;
  }

  onValidChange(key: string, value: any) {
    this.valids[key] = value;
    this.valid = Object.values(this.valids).every((x) => x);
    // console.log('Profile valid:', this.valid, this.valids);
    this.changeDetector.detectChanges();
  }

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.hasChange && this.valid) {
      this.saving = true;
      this.lastError = null;
      if (this.registrationToken) {
        this.api
          .registerUser(this.registrationToken, this.updateValues)
          .toPromise()
          .then(
            () => {
              this.saving = false;
              this.updateValues = {};
              if (this.returnUrl) {
                window.location.href = this.returnUrl;
              } else {
                this.router.navigate(['/registered']);
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
      } else if (this.isNew) {
        this.api
          .createUser(this.updateValues, !this.sendRegistrationLink)
          .toPromise()
          .then(
            (updateResult) => {
              this.saving = false;
              this.updateValues = {};
              this.usersService.invalidate();
              if (updateResult.link) {
                if (this.clipboard.copy(updateResult.link)) {
                  this.toastr.success(
                    'E-Mail with link was sent to user and also copied to clipboard.',
                    'E-Mail and Clipboard'
                  );
                } else {
                  this.toastr.warning(
                    'E-Mail was sent to user, but could not copy link to clipboard. Next block contains the link, copy manually!',
                    'E-Mail and Clipboard'
                  );
                  this.toastr.show(updateResult.link, 'Password Reset', {
                    destroyByClick: false,
                    duration: 60000,
                    status: 'warning',
                  });
                }
              }
              if (this.returnUrl) {
                window.location.href = this.returnUrl;
              } else {
                this.router.navigate(['/users']);
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
      } else {
        this.api
          .updateUser(this.userId, this.updateValues)
          .toPromise()
          .then(
            (updateResult) => {
              this.saving = false;
              this.updateValues = {};
              if (updateResult.link) {
                if (this.clipboard.copy(updateResult.link)) {
                  this.toastr.success(
                    'E-Mail with link was sent to user and also copied to clipboard.',
                    'E-Mail and Clipboard'
                  );
                } else {
                  this.toastr.warning(
                    'E-Mail was sent to user, but could not copy link to clipboard. Next block contains the link, copy manually!',
                    'E-Mail and Clipboard'
                  );
                  this.toastr.show(updateResult.link, 'Password Reset', {
                    destroyByClick: false,
                    duration: 60000,
                    status: 'warning',
                  });
                }
              }
              if (this.returnUrl) {
                window.location.href = this.returnUrl;
              }
              this.usersService.invalidate();
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

  showDeleteUser(dialog: TemplateRef<any>) {
    this.dialogService.open(dialog);
  }

  deleteUser(dialog: NbDialogRef<any>) {
    this.saving = true;
    dialog.close();
    this.api
      .deleteUser(this.userId)
      .toPromise()
      .then(
        () => {
          this.saving = false;
          this.usersService.invalidate();
          this.router.navigate(['/users']);
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
