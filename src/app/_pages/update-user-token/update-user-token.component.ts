import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { map, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { NbToastrService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';
import { UserPropertyWithValue } from 'src/app/_models/user';

@Component({
  templateUrl: './update-user-token.component.html',
  styleUrls: ['./update-user-token.component.scss'],
})
export class UpdateUserTokenComponent implements OnInit, OnDestroy {
  updateData: Record<string, any> = null;
  properties: UserPropertyWithValue[] = [];

  destroyed$ = new Subject<void>();

  saving = false;
  saved = false;
  lastError: string;

  valid = true;
  valids: Record<string, boolean> = {};

  get userId(): string {
    return this.auth.userId;
  }

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private toastr: NbToastrService,
    private auth: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    const tokenData$ = this.route.params.pipe(
      map((params) => params.token),
      switchMap((token) => this.auth.validateUpdateToken(token))
    );
    combineLatest([
      tokenData$,
      this.auth.userId$.pipe(switchMap((userId) => this.api.getUser(userId))),
    ]).subscribe(([updateData, user]) => {
      const propertiesByKey: Record<string, UserPropertyWithValue> =
        user.view_groups.reduce(
          (o, grp) =>
            grp.properties.reduce((o, prop) => {
              o[prop.key] = prop;
              return o;
            }, o),
          Object.create(null)
        );
      this.properties = Object.entries(updateData)
        .map(([key, value]) =>
          Object.hasOwnProperty.call(propertiesByKey, key)
            ? ({
                ...propertiesByKey[key],
                value,
                can_edit: 'nobody',
              } as UserPropertyWithValue)
            : null
        )
        .filter((x) => x != null);
      // Only update possible properties
      this.updateData = this.properties.reduce((o, prop) => {
        o[prop.key] = prop.value;
        return o;
      }, Object.create(null));
    });
  }

  onValidChange(key: string, value: any) {
    this.valids[key] = value;
    this.valid = Object.values(this.valids).every((x) => x);
    // console.log('Profile valid:', this.valid, this.valids);
    this.changeDetector.detectChanges();
  }

  submit($event) {
    $event.stopPropagation();
    $event.preventDefault();
    this.saving = true;
    this.lastError = null;
    this.api
      .updateUser(this.auth.userId, this.updateData)
      .toPromise()
      .then(
        () => {
          this.saving = false;
          this.lastError = '';
          this.saved = true;
          this.updateData = null;
          this.properties = [];
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
