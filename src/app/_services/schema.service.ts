import { Injectable } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import {
  map,
  shareReplay,
  skipUntil,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import {
  GroupType,
  ManagerSchema as ApiManagerSchema,
  UserProperty,
  UserScope,
} from '../_models/schema';
import { ApiService } from './api.service';

export class ManagerSchema implements ApiManagerSchema {
  user_properties: UserProperty[];
  scopes: UserScope[];
  group_types: GroupType[];

  private _propertiesById: Record<string, UserProperty> = null;

  constructor(src?: ApiManagerSchema) {
    this.user_properties = src?.user_properties ?? [];
    this.scopes = src?.scopes ?? [];
    this.group_types = src?.group_types ?? [];
  }

  public get userProperties(): UserProperty[] {
    return this.user_properties;
  }

  public set userProperties(val: UserProperty[]) {
    this.user_properties = val;
  }

  public get groupTypes(): GroupType[] {
    return this.group_types;
  }

  public set groupTypes(val: GroupType[]) {
    this.group_types = val;
  }

  public get propertiesById(): Record<string, UserProperty> {
    if (this._propertiesById == null) {
      this._propertiesById = this.userProperties.reduce((o, prop) => {
        o[prop.key] = prop;
        return o;
      }, {});
    }
    return this._propertiesById;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  private _reloading = false;
  private _hot = false;
  private readonly _reload$ = new BehaviorSubject(null);
  private readonly _next$ = new ReplaySubject<ApiManagerSchema>(1);
  private readonly _schema$: Observable<ManagerSchema>;

  public get schema$(): Observable<ManagerSchema> {
    this._makeHot();
    return this._schema$;
  }

  constructor(private apiService: ApiService, private toastr: NbToastrService) {
    this._schema$ = this._next$.pipe(
      map((apiSchema) => new ManagerSchema(apiSchema)),
      tap(() => (this._reloading = false)),
      shareReplay(1)
    );
  }

  private _makeHot() {
    if (!this._hot) {
      this._hot = true;
      this._reload$
        .pipe(
          tap(() => (this._reloading = true)),
          switchMap(() => this.apiService.getSchema())
        )
        .subscribe(this._next$);
      this._schema$.subscribe(
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

  async updateSchema(schema: ApiManagerSchema): Promise<void> {
    await this.apiService
      .updateSchema({
        user_properties: schema.user_properties,
        scopes: schema.scopes,
        group_types: schema.group_types,
      })
      .toPromise();
    this._next$.next(new ManagerSchema(schema));
  }

  async reload(): Promise<ManagerSchema> {
    if (!this._reloading) {
      this._reload$.next(null);
    }
    const skipFirst$ = new Subject<void>();
    const nextSchema = this._schema$
      .pipe(skipUntil(skipFirst$), take(1))
      .toPromise();
    skipFirst$.next();
    skipFirst$.complete();

    return await nextSchema;
  }

  invalidate() {
    this.reload();
  }
}
