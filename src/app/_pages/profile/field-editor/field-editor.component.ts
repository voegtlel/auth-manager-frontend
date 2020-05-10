import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { UserPropertyWithValue } from 'src/app/_models/user';
import { AuthService } from 'src/app/_services/auth.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import XRegExp from 'xregexp';

@Component({
  selector: 'app-field-editor',
  templateUrl: './field-editor.component.html',
  styleUrls: ['./field-editor.component.scss'],
})
export class FieldEditorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() userId: string;
  @Input() registrationToken: string;
  @Input() property: UserPropertyWithValue;
  @Input() isActive: boolean;
  @Input() overrideType: 'str' | 'datetime' | 'bool' | 'enum' = null;
  @Input() externalError: string;
  @Output() valueChange = new EventEmitter<any>();
  @Output() validChange = new EventEmitter<boolean>();

  _dateValueStr: string;
  _dateValue: Date;

  isAdmin$: Observable<boolean>;
  isAdmin: boolean;

  formatMatch = true;
  requiredMatch = true;

  private destroyed$ = new Subject<void>();

  get registering(): boolean {
    return !!this.registrationToken;
  }

  get propertyType():
    | 'str'
    | 'multistr'
    | 'datetime'
    | 'date'
    | 'bool'
    | 'enum'
    | 'picture'
    | 'email'
    | 'password'
    | 'groups' {
    if (this.overrideType) {
      return this.overrideType;
    }
    return this.property.type;
  }

  get canEdit(): boolean {
    return (
      (this.property.can_edit === 'self' && (this.isSelf || this.isAdmin)) ||
      (this.property.can_edit === 'admin' && this.isAdmin) ||
      this.property.can_edit === 'everybody'
    );
  }

  get isSelf(): boolean {
    return this.registering || this.userId === this.authService.userId;
  }

  get isNew(): boolean {
    return this.userId === 'new';
  }

  get externalErrorMessage(): string {
    if (this.externalError && !this.externalError.endsWith('.')) {
      return this.externalError + '.';
    }
    return this.externalError;
  }

  get dateValue(): Date {
    if (this._dateValueStr !== this.property.value) {
      this._dateValueStr = this.property.value;
      if (this._dateValueStr) {
        this._dateValue = new Date(Date.parse(this._dateValueStr));
      } else {
        this._dateValue = null;
      }
    }
    return this._dateValue;
  }

  set dateValue(value: Date) {
    const wasValid = this.formatMatch && this.requiredMatch;
    if (value == null) {
      if (
        this.property.required &&
        (this.isActive || (this.isNew && this.property.can_edit === 'admin'))
      ) {
        this.requiredMatch = false;
      }
      this.valueChange.emit(this.property.value);
    } else if (value !== this._dateValue) {
      this.requiredMatch = true;
      this._dateValue = value;
      this._dateValueStr =
        ('000' + value.getFullYear()).substr(-4) +
        '-' +
        ('0' + (value.getMonth() + 1)).substr(-2) +
        '-' +
        ('0' + value.getDate()).substr(-2);
      this.property.value = this._dateValueStr;
      this.valueChange.emit(this.property.value);
    }
    const isValid = this.formatMatch && this.requiredMatch;
    if (wasValid !== isValid) {
      this.validChange.emit(isValid);
    }
  }

  constructor(private authService: AuthService) {
    this.isAdmin$ = authService.isAdmin$.pipe(
      map((isAdmin) => !this.registering && isAdmin)
    );
    this.isAdmin$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((isAdmin) => (this.isAdmin = isAdmin));
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  validate() {
    if (!this.property) {
      return;
    }
    if ('password' === this.propertyType && !(this.isNew || this.registering)) {
      return;
    }
    if (['email', 'picture'].includes(this.propertyType)) {
      return;
    }
    const wasValid = this.formatMatch && this.requiredMatch;
    if (this.property.format && this.property.value) {
      const r = XRegExp(this.property.format);
      this.formatMatch = r.test(this.property.value);
    }
    // If required and active, or if required and only the admin can edit, then this must be set
    if (
      this.property.required &&
      (this.isActive || (this.isNew && this.property.can_edit === 'admin'))
    ) {
      this.requiredMatch = !!this.property.value;
    }
    const isValid = this.formatMatch && this.requiredMatch;
    if (wasValid !== isValid) {
      this.validChange.emit(isValid);
    }
    // console.log('Validity:', this.property.key, isValid);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.property) {
      this.validate();
    }
  }

  onChange() {
    this.validate();
    this.valueChange.emit(this.property.value);
  }
}
