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
  @Input() property: UserPropertyWithValue;
  @Input() overrideType: 'str' | 'datetime' | 'bool' | 'enum' = null;
  @Input() externalError: string;
  @Input() registering: boolean;
  @Output() valueChange = new EventEmitter<any>();
  @Output() validChange = new EventEmitter<boolean>();

  isAdmin$: Observable<boolean>;
  isAdmin: boolean;

  formatMatch = true;
  requiredMatch = true;

  private destroyed$ = new Subject<void>();

  get propertyType():
    | 'str'
    | 'multistr'
    | 'datetime'
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
    if (this.property.required && !this.isNew) {
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
