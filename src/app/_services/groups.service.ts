import { Injectable } from '@angular/core';
import { GroupInList } from '../_models/user_group';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { switchMap, shareReplay, map, tap } from 'rxjs/operators';
import { NbToastrService } from '@nebular/theme';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private _reloading = false;
  private _reload$ = new BehaviorSubject(null);
  public readonly groups$: Observable<GroupInList[]>;

  public readonly groupsById$: Observable<Record<string, GroupInList>>;

  constructor(apiService: ApiService, toastr: NbToastrService) {
    this.groups$ = this._reload$.pipe(
      tap(() => (this._reloading = true)),
      switchMap(() => apiService.getGroups()),
      tap(() => (this._reloading = false)),
      shareReplay(1)
    );
    this.groups$.subscribe(
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
    this.groupsById$ = this.groups$.pipe(
      map((groups) =>
        groups.reduce((o, group) => {
          o[group.id] = group;
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
