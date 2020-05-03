import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { switchMap, shareReplay, map, tap } from 'rxjs/operators';
import { NbToastrService } from '@nebular/theme';
import { ClientInList } from '../_models/client';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private _reloading = false;
  private _reload$ = new BehaviorSubject(null);
  public readonly clients$: Observable<ClientInList[]>;

  public readonly clientsById$: Observable<Record<string, ClientInList>>;

  constructor(apiService: ApiService, toastr: NbToastrService) {
    this.clients$ = this._reload$.pipe(
      tap(() => (this._reloading = true)),
      switchMap(() => apiService.getClients()),
      tap(() => (this._reloading = false)),
      shareReplay(1)
    );
    this.clients$.subscribe(
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
    this.clientsById$ = this.clients$.pipe(
      map((clients) =>
        clients.reduce((o, client) => {
          o[client.id] = client;
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
