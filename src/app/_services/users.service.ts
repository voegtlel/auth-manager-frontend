import { Injectable } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { UserProperty } from '../_models/schema';
import { UserListViewData, UsersListViewData } from '../_models/user';
import { ApiService } from './api.service';

export interface ResolvedUser extends Record<string, any> {
  user_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private _reloading = false;
  private _reload$ = new BehaviorSubject(null);
  private _hot = false;
  private readonly _userListViewData$: Observable<UsersListViewData>;
  private readonly _users$: Observable<UserListViewData[]>;
  private readonly _properties$: Observable<UserProperty[]>;
  private readonly _usersById$: Observable<Record<string, UserListViewData>>;
  private readonly _resolvedUsers$: Observable<ResolvedUser[]>;
  private readonly _resolvedUsersById$: Observable<
    Record<string, ResolvedUser>
  >;

  public get userListViewData$(): Observable<UsersListViewData> {
    this._makeHot();
    return this._userListViewData$;
  }

  public get;

  public get users$(): Observable<UserListViewData[]> {
    this._makeHot();
    return this._users$;
  }
  public get properties$(): Observable<UserProperty[]> {
    this._makeHot();
    return this._properties$;
  }
  public get usersById$(): Observable<Record<string, UserListViewData>> {
    this._makeHot();
    return this._usersById$;
  }

  public get resolvedUsers$(): Observable<ResolvedUser[]> {
    this._makeHot();
    return this._resolvedUsers$;
  }

  public get resolvedUsersById$(): Observable<Record<string, ResolvedUser>> {
    this._makeHot();
    return this._resolvedUsersById$;
  }

  constructor(apiService: ApiService, private toastr: NbToastrService) {
    this._userListViewData$ = this._reload$.pipe(
      tap(() => (this._reloading = true)),
      switchMap(() => apiService.getUsers('all')),
      tap(() => (this._reloading = false)),
      shareReplay(1)
    );
    this._users$ = this._userListViewData$.pipe(
      map((userListViewData) => userListViewData.users)
    );
    this._properties$ = this._userListViewData$.pipe(
      map((userListViewData) => userListViewData.properties)
    );
    this._usersById$ = this._users$.pipe(
      map((users) =>
        users.reduce((o, user) => {
          o[user.user_id] = user;
          return o;
        }, {})
      ),
      shareReplay(1)
    );

    this._resolvedUsers$ = this._users$.pipe(
      map((users) =>
        users.map((user) =>
          user.properties.reduce(
            (o, prop) => {
              o[prop.key] = prop.value;
              return o;
            },
            { user_id: user.user_id }
          )
        )
      ),
      shareReplay(1)
    );
    this._resolvedUsersById$ = this._resolvedUsers$.pipe(
      map((users) =>
        users.reduce((o, user) => {
          o[user.user_id] = user;
          return o;
        }, {})
      ),
      shareReplay(1)
    );
  }

  private _makeHot() {
    if (!this._hot) {
      this._hot = true;
      this._userListViewData$.subscribe(
        () => {},
        (err) => {
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
  }

  reload() {
    if (!this._reloading) {
      this._reload$.next(null);
    }
  }

  invalidate() {
    this.reload();
  }
}
