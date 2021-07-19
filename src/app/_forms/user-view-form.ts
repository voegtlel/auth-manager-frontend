import { pairwise } from 'rxjs/operators';
import {
  UserFilter,
  UserFilterOp,
  UserGroupPropertyType,
  UserViewGroup,
  UserViewInRead,
  UserViewInWrite,
} from '../_models/user_view';
import {
  TypedFormArray,
  TypedFormControl,
  TypedFormGroup,
} from './typed-forms';

export class FilterFormArray extends TypedFormArray<
  UserFilter,
  FilterFormGroup[]
> {
  constructor(values: UserFilter[]) {
    super(values.map((value) => new FilterFormGroup(value)));
  }
}

export class FilterFormGroup extends TypedFormGroup<
  UserFilter,
  {
    op: TypedFormControl<UserFilterOp>;
    field?: TypedFormControl<string>;
    value?: TypedFormControl<any>;
    operands?: FilterFormArray;
    operand?: FilterFormGroup;
  }
> {
  get op(): UserFilterOp {
    return this.controls.op.value;
  }

  set op(value: UserFilterOp) {
    this.controls.op.setValue(value);
  }

  private _setControls(
    oldType: UserFilterOp,
    newType: UserFilterOp,
    values?: UserFilter
  ) {
    let operands = values?.operands ?? [];
    let operand = values?.operand ?? { op: null };
    let field = values?.field;
    let value = values?.value;
    if (['and', 'or'].includes(oldType)) {
      operands = this.controls.operands.value;
      this.removeControl('operands');
    } else if (['not'].includes(oldType)) {
      operand = this.controls.operand.value;
      this.removeControl('operand');
    } else if (['eq', 'ne', 'gt', 'lt', 'ge', 'le'].includes(oldType)) {
      value = this.controls.value.value;
      field = this.controls.field.value;
      this.removeControl('value');
      this.removeControl('field');
    } else if (oldType != null) {
      throw new Error(`Not implemented op ${oldType}`);
    }
    if (['and', 'or'].includes(newType)) {
      this.addControl('operands', new FilterFormArray(operands));
    } else if (['not'].includes(newType)) {
      this.addControl('operand', new FilterFormGroup(operand));
    } else if (['eq', 'ne', 'gt', 'lt', 'ge', 'le'].includes(newType)) {
      this.addControl('value', new TypedFormControl(value));
      this.addControl('field', new TypedFormControl(field));
    } else if (newType != null) {
      throw new Error(`Not implemented op ${newType}`);
    }
  }

  constructor(filter: UserFilter) {
    super({
      op: new TypedFormControl(filter.op),
    });
    this.controls.op.value$
      .pipe(pairwise())
      .subscribe(([lastOp, currentOp]) => this._setControls(lastOp, currentOp));
    this._setControls(null, filter.op, filter);
  }
}

export class PropertiesFormArray extends TypedFormArray<
  string,
  TypedFormControl<string>[]
> {
  constructor(properties: string[]) {
    super(properties.map((property) => new TypedFormControl(property)));
  }

  push(control?: TypedFormControl<string>) {
    super.push(control ?? new TypedFormControl(''));
  }
}

export class UserViewGroupFormGroup extends TypedFormGroup<
  UserViewGroup,
  {
    title: TypedFormControl<string>;
    type: TypedFormControl<UserGroupPropertyType>;
    user_properties: PropertiesFormArray;
  }
> {
  constructor(viewGroup?: UserViewGroup) {
    super({
      title: new TypedFormControl(viewGroup?.title ?? ''),
      type: new TypedFormControl(viewGroup?.type ?? 'default'),
      user_properties: new PropertiesFormArray(
        viewGroup?.user_properties ?? []
      ),
    });
  }
}

export class UserViewGroupFormArray extends TypedFormArray<
  UserViewGroup,
  UserViewGroupFormGroup[]
> {
  constructor(viewGroups: UserViewGroup[]) {
    super(viewGroups.map((viewGroup) => new UserViewGroupFormGroup(viewGroup)));
  }

  push(control?: UserViewGroupFormGroup) {
    super.push(control ?? new UserViewGroupFormGroup());
  }
}

export class UserViewForm extends TypedFormGroup<
  UserViewInWrite,
  {
    name: TypedFormControl<string>;
    filter?: FilterFormGroup;
    list_properties: PropertiesFormArray;
    view_groups: UserViewGroupFormArray;
  }
> {
  get filter(): UserFilter {
    return this.controls.filter?.value;
  }

  set filter(value: UserFilter) {
    if (value == null) {
      this.removeControl('filter');
    } else if (this.controls.filter) {
      this.setControl('filter', new FilterFormGroup(value));
    } else {
      this.addControl('filter', new FilterFormGroup(value));
    }
  }

  constructor(userView?: UserViewInRead) {
    super({
      name: new TypedFormControl(userView?.name ?? ''),
      list_properties: new PropertiesFormArray(userView?.list_properties ?? []),
      view_groups: new UserViewGroupFormArray(userView?.view_groups ?? []),
    });
    if (userView?.filter) {
      this.addControl('filter', new FilterFormGroup(userView.filter));
    }
  }
}
