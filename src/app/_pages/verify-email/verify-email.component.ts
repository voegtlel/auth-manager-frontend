import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/_services/api.service';
import { NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();

  saving = false;
  lastError: string;

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
    const verifyToken$ = this.route.params.pipe(map((params) => params.token));

    verifyToken$
      .pipe(switchMap((token) => this.api.verifyEmail(token)))
      .subscribe(
        () => {
          this.saving = false;
          this.lastError = null;
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
