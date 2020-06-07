import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { FormControl, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-string-list-edit',
  templateUrl: './string-list-edit.component.html',
  styleUrls: ['./string-list-edit.component.scss'],
})
export class StringListEditComponent implements OnInit, OnChanges, OnDestroy {
  @Input() entriesFormArray: FormArray;

  @Input() placeholder: string;
  @Input() placeholderAdd: string;

  statusChangesSubscription: Subscription;

  clientIdControl = new FormControl('');

  get disabled(): boolean {
    return this.entriesFormArray.disabled;
  }

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy() {
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
      this.statusChangesSubscription = null;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entriesFormArray) {
      if (this.statusChangesSubscription) {
        this.statusChangesSubscription.unsubscribe();
        this.statusChangesSubscription = null;
      }
      this.statusChangesSubscription = this.entriesFormArray.statusChanges.subscribe(
        () => {
          if (this.entriesFormArray.disabled) {
            this.clientIdControl.disable();
          } else {
            this.clientIdControl.enable();
          }
        }
      );
    }
  }

  removeEntry(index: number) {
    this.entriesFormArray.removeAt(index);
    this.entriesFormArray.markAsDirty({ onlySelf: true });
    this.entriesFormArray.updateValueAndValidity();
  }

  addEntry($event: Event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.disabled) {
      return;
    }
    const newControl = new FormControl(this.clientIdControl.value);
    this.entriesFormArray.push(newControl);
    newControl.markAsDirty();
    newControl.markAsTouched();
    this.entriesFormArray.markAsDirty({ onlySelf: true });
    this.clientIdControl.reset('');
    this.entriesFormArray.updateValueAndValidity();
  }
}
