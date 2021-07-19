import { Injectable } from '@angular/core';
import { GroupInList } from '../_models/user_group';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { switchMap, shareReplay, map, tap } from 'rxjs/operators';
import { NbToastrService } from '@nebular/theme';
import { UserViewInList } from '../_models/user_view';

@Injectable({
  providedIn: 'root',
})
export class UserViewsService {
  private _reloading = false;
  private _reload$ = new BehaviorSubject(null);
  public readonly userViews$: Observable<UserViewInList[]>;

  constructor(apiService: ApiService, toastr: NbToastrService) {
    this.userViews$ = this._reload$.pipe(
      tap(() => (this._reloading = true)),
      switchMap(() => apiService.getUserViews()),
      tap(() => (this._reloading = false)),
      shareReplay(1)
    );
    this.userViews$.subscribe(
      () => {},
      (err) => {
        if (err?.status === 0) {
          toastr.danger(err?.statusText, 'Error');
        } else if (err?.error?.detail) {
          toastr.danger(err?.error?.detail, 'Error');
        } else if (err?.error) {
          toastr.danger(err?.error, 'Error');
        }
      }
    );
  }

  reload() {
    if (!this._reloading) {
      this._reload$.next(null);
    }
  }
}
