import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/_services/api.service';
import { takeUntil, filter, switchMap, map } from 'rxjs/operators';
import { Subject, of, combineLatest } from 'rxjs';
import { UserViewData, UserPropertyWithValue } from 'src/app/_models/user';
import { AuthService } from 'src/app/_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';

@Component({
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  profileData: UserViewData = null;
  userId: string;
  registrationToken: string;

  lastError: string;
  updateValues: Record<string, any> = {};
  valid = true;
  valids: Record<string, boolean> = {};
  saving = false;
  loading = true;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
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
              this.router.navigate(['/registered']);
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
          .createUser(this.updateValues)
          .toPromise()
          .then(
            () => {
              this.saving = false;
              this.updateValues = {};
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
      } else {
        this.api
          .updateUser(this.userId, this.updateValues)
          .toPromise()
          .then(
            () => {
              this.saving = false;
              this.updateValues = {};
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
}
