import {
  AbstractControl,
  AbstractControlOptions,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';

export interface ITypedAbstractControl<T> extends AbstractControl {
  readonly value: T;

  setValue(value: T, options?: Object): void;
  patchValue(value: T, options?: Object): void;
  reset(value?: T, options?: Object): void;
}

export interface ITypedFormControl<T>
  extends FormControl,
    ITypedAbstractControl<T> {
  readonly value: T;

  setValue(
    value: T,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
      emitModelToViewChange?: boolean;
      emitViewToModelChange?: boolean;
    }
  ): void;

  patchValue(
    value: T,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
      emitModelToViewChange?: boolean;
      emitViewToModelChange?: boolean;
    }
  ): void;

  reset(
    formState?: T,
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

export class TypedFormControl<T>
  extends FormControl
  implements ITypedFormControl<T> {
  value: T;
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
  }

  registerControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): ITypedAbstractControl<TResult[TKey]> {
    return super.registerControl(<string>name, control);
  }
  addControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): void {
    super.registerControl(<string>name, control);
  }
  removeControl<TKey extends keyof TResult>(name: TKey): void {
    super.removeControl(<string>name);
  }
  setControl<TKey extends keyof TResult>(
    name: TKey,
    control: ITypedAbstractControl<TResult[TKey]>
  ): void {
    super.setControl(<string>name, control);
  }
  contains<TKey extends keyof TResult>(controlName: TKey): boolean {
    return super.contains(<string>controlName);
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
  }

  at(index: number): ITypedAbstractControl<TElementType> {
    return super.at(index);
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
    return this.getRawValue();
  }
}
