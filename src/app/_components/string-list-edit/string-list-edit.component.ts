import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TypedFormArray, TypedFormControl } from 'src/app/_forms/typed-forms';

@Component({
  selector: 'app-string-list-edit',
  templateUrl: './string-list-edit.component.html',
  styleUrls: ['./string-list-edit.component.scss'],
})
export class StringListEditComponent implements OnInit, OnDestroy {
  @Input() formArray: TypedFormArray<string>;

  @Input() placeholder: string;
  @Input() placeholderAdd: string;

  statusChangesSubscription: Subscription;

  get disabled(): boolean {
    return this.formArray.disabled;
  }

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy() {
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
      this.statusChangesSubscription = null;
    }
  }

  removeEntry(index: number) {
    this.formArray.removeAt(index);
    this.formArray.markAsDirty();
    this.formArray.updateValueAndValidity();
  }

  addEntry($event: Event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.disabled) {
      return;
    }
    const newControl = new TypedFormControl<string>('');
    this.formArray.push(newControl);
    newControl.markAsDirty();
    newControl.markAsTouched();
    this.formArray.markAsDirty();
    this.formArray.updateValueAndValidity();
  }
}
