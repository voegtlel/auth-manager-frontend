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
import { ClientGroupForm } from 'src/app/_forms/client-form';
import { GroupsService } from 'src/app/_services/groups.service';

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

  form = new ClientGroupForm(this.groupsService.groupsById$, null, [
    (x) => this.validateFormId(x),
  ]);

  get isNew(): boolean {
    return this.clientId === 'new';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  constructor(
    private api: ApiService,
    private clientsService: ClientsService,
    private groupsService: GroupsService,
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
            this.form = new ClientGroupForm(
              this.groupsService.groupsById$,
              null,
              [(x) => this.validateFormId(x)]
            );
            this.form.controls.id.enable();
            this.form.updateValueAndValidity();
          } else {
            this.form = new ClientGroupForm(
              this.groupsService.groupsById$,
              clientData,
              [(x) => this.validateFormId(x)]
            );
            this.form.controls.id.disable();
            this.form.updateValueAndValidity();
          }
        },
        (err) => {
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
    if (this.clientId === 'new') {
      this.api
        .createClient(this.form.getRawValue())
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
        .updateClient(this.clientId, this.form.getRawValue())
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
