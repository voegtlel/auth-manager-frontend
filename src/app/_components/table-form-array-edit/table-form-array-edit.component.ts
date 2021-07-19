import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  Output,
} from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import {
  map,
  filter,
  switchMap,
  distinctUntilChanged,
  tap,
  shareReplay,
} from 'rxjs/operators';
import {
  TableColumn,
  TableEntry,
} from 'src/app/_components/table/table.component';
import {
  ITypedAbstractControl,
  TypedFormArray,
} from 'src/app/_forms/typed-forms';

interface SelectedData extends TableEntry {
  data: ITypedAbstractControl<any>;
}

@Component({
  selector: 'app-table-form-array-edit',
  templateUrl: './table-form-array-edit.component.html',
  styleUrls: ['./table-form-array-edit.component.scss'],
})
export class TableFormArrayEditComponent implements OnChanges {
  @Input() title: string;
  @Input() addTitle: string;

  @Input() data: TypedFormArray<any>;
  @Input() allData: any[];

  @Input() columnsView: TableColumn[];
  @Input() columnsEdit: TableColumn[];
  @Input() columnsAdd: TableColumn[];

  @Input() idControl: (selectedRow: ITypedAbstractControl<any>) => string;
  @Input() idAllData: (entry: any) => string;
  @Input() excludeIds: string[];

  @Output() addEntry = new EventEmitter<any>();

  data$ = new BehaviorSubject<TypedFormArray<any>>(null);
  allData$ = new BehaviorSubject<any[]>(null);
  excludeIds$ = new BehaviorSubject<string[]>(null);

  remainingData$: Observable<TableEntry[]>;
  selectedData$: Observable<SelectedData[]>;
  disabled$: Observable<boolean>;

  constructor(private dialogService: NbDialogService) {
    const formArray$: Observable<TypedFormArray<any>> = this.data$.pipe(
      switchMap(
        (formArray) => formArray?.value$.pipe(map(() => formArray)) ?? of(null)
      ),
      shareReplay(1)
    );
    this.disabled$ = formArray$.pipe(
      distinctUntilChanged((v1, v2) => v1?.disabled === v2?.disabled),
      map((v) => v?.disabled ?? true)
    );
    const safeFormArray$ = formArray$.pipe(
      filter((formArray) => !!formArray),
      distinctUntilChanged(
        (fal1, fal2) => fal1 === fal2,
        (fa) => fa.controls.length
      )
    );
    this.selectedData$ = safeFormArray$.pipe(
      map((formArray) => formArray.controls.map((entry) => ({ data: entry })))
    );
    const selectedIds$ = safeFormArray$.pipe(
      map((formArray) =>
        formArray.controls.reduce((o, control) => {
          o[this.idControl(control)] = true;
          return o;
        }, {})
      )
    );
    this.remainingData$ = combineLatest([
      this.allData$.pipe(filter((d) => !!d)),
      selectedIds$,
    ]).pipe(
      map(([allData, selectedIds]) =>
        allData.filter(
          (entry) =>
            !selectedIds[this.idAllData(entry)] &&
            (!this.excludeIds ||
              !this.excludeIds.includes(this.idAllData(entry)))
        )
      ),
      map((groups) => groups.map((group) => ({ data: group })))
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data) {
      this.data$.next(this.data);
    }
    if (changes.allData) {
      this.allData$.next(this.allData);
    }
    if (changes.excludeIds) {
      this.excludeIds$.next(this.excludeIds);
    }
  }

  onAddDialog(dialogRef: TemplateRef<any>) {
    this.dialogService.open(dialogRef);
  }

  addClick(allEntry: any) {
    this.addEntry.emit(allEntry);
  }
}
