import { Component, OnInit, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NbToastrService } from '@nebular/theme';
import { ManagerSchema, SchemaService } from 'src/app/_services/schema.service';
import { UserPropertyWithValue } from 'src/app/_models/user';

import { SchemaForm } from 'src/app/_forms/schema-form';

@Component({
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.scss'],
})
export class SchemaComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  schema: ManagerSchema = null;

  lastError: string;
  saving = false;
  loading = true;

  readonly defaultValueProperty: UserPropertyWithValue = {
    key: 'key',
    can_edit: 'everybody',
    can_read: 'everybody',
    visible: 'everybody',
    title: 'Default Value',
    type: 'str',
    value: null,
  };

  form: SchemaForm = null;

  constructor(
    private schemaService: SchemaService,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.schemaService.schema$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((schema) => {
        this.loading = false;
        this.form = new SchemaForm(schema);
      });
  }

  submit($event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (!this.form.valid) {
      return;
    }
    this.saving = true;
    this.schemaService.updateSchema(this.form.getRawValue()).then(
      () => {
        this.saving = false;
        this.form.markAsPristine();
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
