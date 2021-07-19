import {
  AbstractControl,
  AbstractControlOptions,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { BehaviorSubject, combineLatest, defer, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface ITypedAbstractControl<T> extends AbstractControl {
  readonly value: T;
  readonly value$: Observable<T>;

  setValue(value: T, options?: object): void;
  patchValue(value: T, options?: object): void;
  reset(value?: T, options?: object): void;
}

export interface ITypedFormControl<TResult>
  extends FormControl,
    ITypedAbstractControl<TResult> {
  readonly value: TResult;
  readonly valueChanges: Observable<TResult>;
  readonly value$: Observable<TResult>;

  setValue(
    value: TResult,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
      emitModelToViewChange?: boolean;
      emitViewToModelChange?: boolean;
    }
  ): void;

  patchValue(
    value: TResult,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
      emitModelToViewChange?: boolean;
      emitViewToModelChange?: boolean;
    }
  ): void;

  reset(
    formState?: TResult,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;
}

export interface ITypedFormGroup<
  TResult extends {
    [key: string]: any;
  } = {},
  TControls extends {
    [key in keyof TResult]: ITypedAbstractControl<TResult[key]>;
  } = { [key in keyof TResult]: ITypedAbstractControl<TResult[key]> }
> extends FormGroup,
    ITypedAbstractControl<TResult> {
  controls: TControls;
  value: TResult;
  readonly valueChanges: Observable<TResult>;
  readonly value$: Observable<TResult>;

  registerControl(
    name: string,
    control: ITypedAbstractControl<any>
  ): ITypedAbstractControl<any>;
  addControl(name: string, control: ITypedAbstractControl<any>): void;
  removeControl(name: string): void;
  setControl(name: string, control: ITypedAbstractControl<any>): void;
  contains(controlName: string): boolean;

  registerControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): ITypedAbstractControl<TResult[TKey]>;
  addControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): void;
  removeControl<TKey extends keyof TResult>(name: TKey): void;
  setControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): void;
  contains<TKey extends keyof TResult>(controlName: TKey): boolean;

  /*registerControl(name: string, control: AbstractControl): AbstractControl;
    addControl(name: string, control: AbstractControl): void;
    removeControl(name: string): void;
    setControl(name: string, control: AbstractControl): void;
    contains(controlName: string): boolean;*/

  setValue(
    value: TResult,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;

  patchValue(
    value: Partial<TResult>,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;

  reset(
    value?: Partial<TResult>,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;

  getRawValue(): TResult;
}

export interface ITypedFormArray<
  TElementType,
  TControls extends ITypedAbstractControl<TElementType>[] = ITypedAbstractControl<TElementType>[],
  TResult extends TElementType[] = TElementType[]
> extends FormArray,
    ITypedAbstractControl<TResult> {
  controls: TControls;
  value: TResult;
  readonly valueChanges: Observable<TResult>;
  readonly value$: Observable<TResult>;

  at(index: number): ITypedAbstractControl<TElementType>;
  push(control: ITypedAbstractControl<TElementType>): void;
  insert(index: number, control: ITypedAbstractControl<TElementType>): void;
  setControl(index: number, control: ITypedAbstractControl<TElementType>): void;

  setValue(
    value: Partial<TElementType>[],
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;
  patchValue(
    value: Partial<TElementType>[],
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;
  reset(
    value?: Partial<TElementType>[],
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
    }
  ): void;
  getRawValue(): TResult;
}

export class TypedFormControl<TResult>
  extends FormControl
  implements ITypedFormControl<TResult> {
  value: TResult;
  readonly value$: Observable<TResult> = defer(() =>
    this.valueChanges.pipe(startWith(this.value))
  );
  private readonly _parent$ = new BehaviorSubject<FormGroup | FormArray>(
    this.parent
  );
  readonly parent$: Observable<
    FormGroup | FormArray
  > = this._parent$.asObservable();

  setParent(parent: FormGroup | FormArray) {
    super.setParent(parent);
    this._parent$.next(parent);
  }
}

export class TypedFormGroup<
    TResult extends Record<string, any>,
    TControls extends {
      [key in keyof TResult]: ITypedAbstractControl<TResult[key]>;
    } = { [key in keyof TResult]: ITypedAbstractControl<TResult[key]> }
  >
  extends FormGroup
  implements ITypedFormGroup<TResult, TControls> {
  controls: TControls;
  value: TResult;
  readonly valueChanges: Observable<TResult>;
  readonly value$: Observable<TResult> = defer(() =>
    this.valueChanges.pipe(startWith(this.value))
  );
  private readonly _parent$ = new BehaviorSubject<FormGroup | FormArray>(
    this.parent
  );
  readonly parent$: Observable<
    FormGroup | FormArray
  > = this._parent$.asObservable();

  constructor(
    controls: TControls,
    validatorOrOpts?:
      | ValidatorFn
      | ValidatorFn[]
      | AbstractControlOptions
      | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ) {
    super(controls, validatorOrOpts, asyncValidator);
    // Set parent again, so it'll have a valid chained parent
    for (const control of Object.values(this.controls)) {
      if (control.parent$) {
        control.setParent(this);
      }
    }
  }

  setParent(parent: FormGroup | FormArray) {
    super.setParent(parent);
    this._parent$.next(parent);
  }

  registerControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): ITypedAbstractControl<TResult[TKey]> {
    return super.registerControl(
      name as string,
      control
    ) as ITypedAbstractControl<TResult[TKey]>;
  }
  addControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): void {
    super.registerControl(name as string, control);
  }
  removeControl<TKey extends keyof TResult>(name: TKey): void {
    super.removeControl(name as string);
  }
  setControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): void {
    super.setControl(name as string, control);
  }
  contains<TKey extends keyof TResult>(controlName: TKey): boolean {
    return super.contains(controlName as string);
  }

  public onChange<TKeys extends keyof TResult>(
    controls: TKeys[]
  ): Observable<Pick<TResult, TKeys>> {
    return combineLatest(
      controls.map((control) => this.controls[control].value$)
    ).pipe(
      map((vals) =>
        controls.reduce((o, key, idx) => {
          o[key as any] = vals[idx];
          return o;
        }, {} as Pick<TResult, TKeys>)
      )
    );
  }
}

export class TypedFormArray<
    TElementType,
    TControls extends ITypedAbstractControl<TElementType>[] = ITypedAbstractControl<TElementType>[],
    TResult extends TElementType[] = TElementType[]
  >
  extends FormArray
  implements ITypedFormArray<TElementType, TControls, TResult> {
  controls: TControls;
  value: TResult;
  readonly valueChanges: Observable<TResult>;
  readonly value$: Observable<TResult> = defer(() =>
    this.valueChanges.pipe(startWith(this.value))
  );
  private readonly _parent$ = new BehaviorSubject<FormGroup | FormArray>(
    this.parent
  );
  readonly parent$: Observable<
    FormGroup | FormArray
  > = this._parent$.asObservable();

  constructor(
    controls: TControls,
    validatorOrOpts?:
      | ValidatorFn
      | ValidatorFn[]
      | AbstractControlOptions
      | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ) {
    super(controls, validatorOrOpts, asyncValidator);
    // Set parent again, so it'll have a valid chained parent
    for (const control of this.controls) {
      if ((control as any).parent$) {
        control.setParent(this);
      }
    }
  }

  setParent(parent: FormGroup | FormArray) {
    super.setParent(parent);
    this._parent$.next(parent);
  }

  at(index: number): ITypedAbstractControl<TElementType> {
    return super.at(index) as ITypedAbstractControl<TElementType>;
  }
  push(control: ITypedAbstractControl<TElementType>): void {
    super.push(control);
  }
  insert(index: number, control: ITypedAbstractControl<TElementType>): void {
    super.insert(index, control);
  }
  setControl(
    index: number,
    control: ITypedAbstractControl<TElementType>
  ): void {
    super.setControl(index, control);
  }

  getRawValue(): TResult {
    return super.getRawValue() as TResult;
  }
}
