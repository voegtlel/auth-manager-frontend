import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { switchMap, shareReplay, map, tap } from 'rxjs/operators';
import { NbToastrService } from '@nebular/theme';
import {
  UsersListViewData,
  UserListViewData,
  UserPropertyWithKey,
} from '../_models/user';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private _reloading = false;
  private _reload$ = new BehaviorSubject(null);
  public readonly userListViewData$: Observable<UsersListViewData>;
  public readonly users$: Observable<UserListViewData[]>;
  public readonly properties$: Observable<UserPropertyWithKey[]>;
  public readonly usersById$: Observable<Record<string, UserListViewData>>;

  constructor(apiService: ApiService, toastr: NbToastrService) {
    this.userListViewData$ = this._reload$.pipe(
      tap(() => (this._reloading = true)),
      switchMap(() => apiService.getUsers()),
      tap(() => (this._reloading = false)),
      shareReplay(1)
    );
    this.userListViewData$.subscribe(
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
    this.users$ = this.userListViewData$.pipe(
      map((userListViewData) => userListViewData.users)
    );
    this.properties$ = this.userListViewData$.pipe(
      map((userListViewData) => userListViewData.properties)
    );
    this.usersById$ = this.users$.pipe(
      map((users) =>
        users.reduce((o, user) => {
          o[user.user_id] = user;
          return o;
        }, {})
      ),
      shareReplay(1)
    );
  }

  reload() {
    if (!this._reloading) {
      this._reload$.next(null);
    }
  }
}
