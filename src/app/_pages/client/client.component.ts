import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  Validators,
  ValidationErrors,
  FormArray,
} from '@angular/forms';
import { ClientsService } from 'src/app/_services/clients.service';
import { takeUntil, map, switchMap, tap, take, filter } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService, NbDialogRef, NbDialogService } from '@nebular/theme';
import { Client } from 'src/app/_models/client';
import { OAuthService, OAuthSuccessEvent } from 'angular-oauth2-oidc';

const requiredGrantMap: Record<string, string[]> = {
  code: ['authorization_code'],
  token: [],
  id_token: ['implicit'],
  ['code token']: ['authorization_code', 'implicit'],
  ['code id_token']: ['authorization_code', 'implicit'],
  ['token id_token']: ['implicit'],
  ['code token id_token']: ['authorization_code', 'implicit'],
};

@Component({
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss'],
})
export class ClientComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  clientData: Client = null;
  clientId: string;

  availableScopes$: Observable<string[]>;

  lastError: string;
  saving = false;
  loading = true;

  canGeneratePassword = !!window.crypto?.getRandomValues;

  private _clientFormElements: Record<keyof Client, FormControl | FormArray> = {
    id: new FormControl(
      null,
      [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.+-]+$/)],
      [(x) => this.validateFormId(x)]
    ),
    notes: new FormControl(null),
    redirect_uri: new FormArray([]),
    allowed_scope: new FormControl([]),
    client_secret: new FormControl(null),
    token_endpoint_auth_method: new FormControl([]),
    response_type: new FormControl([]),
    grant_type: new FormControl([], (control) =>
      this.validateGrantTypes(control)
    ),
    access_groups: new FormControl([]),
  };

  form = new FormGroup(this._clientFormElements);

  get isNew(): boolean {
    return this.clientId === 'new';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  constructor(
    private api: ApiService,
    private clientsService: ClientsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: NbToastrService,
    private dialogService: NbDialogService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    const clientId$ = this.route.params.pipe(
      map((params) => params.clientId as string)
    );
    clientId$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((clientId) => (this.clientId = clientId));

    clientId$
      .pipe(
        tap((clientId) => console.log('clientId:', clientId)),
        switchMap((clientId) =>
          clientId !== 'new' ? this.api.getClient(clientId) : of(null)
        ),
        takeUntil(this.destroyed$)
      )
      .subscribe(
        (clientData: Client) => {
          this.loading = false;
          if (clientData === null) {
            this.form.reset({
              id: null,
              notes: null,
              redirect_uri: [''],
              allowed_scope: [],
              client_secret: null,
              token_endpoint_auth_method: [],
              response_type: [],
              grant_type: [],
              access_groups: [],
            } as Client);
            const redirectUriFormArray = this._clientFormElements
              .redirect_uri as FormArray;
            while (redirectUriFormArray.length > 0) {
              redirectUriFormArray.removeAt(0);
            }
            redirectUriFormArray.push(new FormControl(''));
            this.form.updateValueAndValidity();
            console.log('Reset form:', this.form.value);
          } else {
            const redirectUriFormArray = this._clientFormElements
              .redirect_uri as FormArray;
            while (redirectUriFormArray.length > 0) {
              redirectUriFormArray.removeAt(0);
            }
            for (const clientUri of clientData.redirect_uri) {
              redirectUriFormArray.push(new FormControl(clientUri));
            }
            this.form.reset(clientData);
            this.form.updateValueAndValidity();
          }
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
    this.availableScopes$ = this.authService.discoveryDocument$.pipe(
      map((discoveryDocument) => discoveryDocument?.scopes_supported)
    );
  }

  validateFormId(
    control: AbstractControl
  ): Observable<Record<string, any> | null> {
    return this.clientsService.clientsById$.pipe(
      take(1),
      takeUntil(this.destroyed$),
      map(
        (clientsById) =>
          clientsById.hasOwnProperty(control.value) &&
          control.value !== this.clientId
      ),
      map((clientExists) => (clientExists ? { clientExists: true } : null))
    );
  }

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (!this.form.valid) {
      return;
    }
    this.saving = true;
    const formValue: Client = this.form.value;
    if (this.clientId === 'new') {
      this.api
        .createClient(formValue)
        .toPromise()
        .then(
          () => {
            this.saving = false;
            this.form.markAsPristine();
            this.clientsService.reload();
            this.router.navigate(['/clients']);
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
        .updateClient(this.clientId, formValue)
        .toPromise()
        .then(
          () => {
            this.saving = false;
            this.form.markAsPristine();
            this.clientsService.reload();
            this.router.navigate(['/clients']);
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

  generatePassword() {
    this.form
      .get('client_secret')
      .setValue(this.authService.generatePassword());
  }

  validateGrantTypes(control: AbstractControl): ValidationErrors {
    if (!this.form) {
      return null;
    }
    const grantTypes = new Set<string>(control.value ?? []);
    const missingTypes = new Set<string>();
    const responseTypes: string[] = this.form.get('response_type').value;
    if (!responseTypes) {
      return;
    }
    for (const responseType of responseTypes) {
      requiredGrantMap[responseType]
        .filter((requiredType) => !grantTypes.has(requiredType))
        .forEach((missingType) => missingTypes.add(missingType));
    }
    if (missingTypes.size > 0) {
      return {
        missingTypes: [...missingTypes].join(', '),
      };
    }
    return null;
  }

  showDeleteClient(dialog: TemplateRef<any>) {
    this.dialogService.open(dialog);
  }

  deleteClient(dialog: NbDialogRef<any>) {
    this.saving = true;
    dialog.close();
    this.api
      .deleteClient(this.clientId)
      .toPromise()
      .then(
        () => {
          this.saving = false;
          this.clientsService.reload();
          this.router.navigate(['/clients']);
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
