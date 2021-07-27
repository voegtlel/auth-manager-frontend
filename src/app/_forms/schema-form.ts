import { Validators } from '@angular/forms';
import {
  ManagerSchema as ApiManagerSchema,
  UserProperty,
  PropertyType,
  AccessType,
  EnumValue,
  UserScope,
  UserScopeProperty,
  GroupType,
} from '../_models/schema';
import {
  TypedFormArray,
  TypedFormControl,
  TypedFormGroup,
} from './typed-forms';

export class EnumValueFormGroup extends TypedFormGroup<
  EnumValue,
  {
    title: TypedFormControl<string>;
    value: TypedFormControl<string>;
  }
> {
  constructor(value?: EnumValue) {
    super({
      title: new TypedFormControl(value?.title ?? '', [Validators.required]),
      value: new TypedFormControl(value?.value ?? '', [Validators.required]),
    });
  }
}

export class EnumValueFormArray extends TypedFormArray<
  EnumValue,
  EnumValueFormGroup[]
> {
  constructor(values: EnumValue[]) {
    super(values ? values.map((value) => new EnumValueFormGroup(value)) : []);
  }
}

export class SchemaUserPropertyFormGroup extends TypedFormGroup<
  UserProperty,
  {
    key: TypedFormControl<string>;

    type: TypedFormControl<PropertyType>;
    format: TypedFormControl<string>;
    format_help: TypedFormControl<string>;
    can_edit: TypedFormControl<AccessType>;
    can_read: TypedFormControl<AccessType>;
    write_once: TypedFormControl<boolean>;
    default: TypedFormControl<any>;
    visible: TypedFormControl<AccessType>;
    title: TypedFormControl<string>;
    values: EnumValueFormArray;
    template: TypedFormControl<string>;
    required: TypedFormControl<boolean>;

    protected: TypedFormControl<boolean>;
  }
> {
  constructor(value?: UserProperty) {
    super({
      key: new TypedFormControl(value?.key ?? '', [Validators.required]),

      type: new TypedFormControl(value?.type ?? 'str', [Validators.required]),
      format: new TypedFormControl(value?.format),
      format_help: new TypedFormControl(value?.format_help),
      can_edit: new TypedFormControl(value?.can_edit ?? true),
      can_read: new TypedFormControl(value?.can_read ?? true),
      write_once: new TypedFormControl(value?.write_once ?? false),
      default: new TypedFormControl(value?.default),
      visible: new TypedFormControl(value?.visible ?? true),
      title: new TypedFormControl(value?.title ?? '', [Validators.required]),
      values: new EnumValueFormArray(value?.values),
      template: new TypedFormControl(value?.template),
      required: new TypedFormControl(value?.required),

      protected: new TypedFormControl(value?.protected ?? false),
    });
    this.controls.protected.disable();
    if (value?.protected) {
      this.controls.key.disable();
      this.controls.type.disable();
      this.controls.write_once.disable();
      this.controls.default.disable();
      this.controls.visible.disable();
      this.controls.title.disable();
    }
  }

  getRawValue(): UserProperty {
    const result = super.getRawValue();
    if (
      result.default == null ||
      result.default === '' ||
      result.default === false
    ) {
      delete result.default;
    }
    if (result.format == null || result.format === '') {
      delete result.format;
    }
    if (result.format_help == null || result.format_help === '') {
      delete result.format_help;
    }
    if (!result.protected) {
      delete result.protected;
    }
    if (!result.required) {
      delete result.required;
    }
    if (!result.write_once) {
      delete result.write_once;
    }
    if (result.template == null || result.template === '') {
      delete result.template;
    }
    if (result.values == null || !result.values.length) {
      delete result.values;
    }
    return result;
  }
}

export class SchemaUserPropertyFormArray extends TypedFormArray<
  UserProperty,
  SchemaUserPropertyFormGroup[]
> {
  constructor(values: UserProperty[]) {
    super(values.map((value) => new SchemaUserPropertyFormGroup(value)));
  }

  push(control?: SchemaUserPropertyFormGroup) {
    super.push(control ?? new SchemaUserPropertyFormGroup());
  }
}

export class UserScopePropertyFormGroup extends TypedFormGroup<
  UserScopeProperty,
  {
    user_property: TypedFormControl<string>;
    key: TypedFormControl<string>;
    group_type: TypedFormControl<string>;
  }
> {
  constructor(scope?: UserScopeProperty) {
    super({
      user_property: new TypedFormControl(scope?.user_property ?? '', [
        Validators.required,
      ]),
      key: new TypedFormControl(scope?.key),
      group_type: new TypedFormControl(scope?.group_type),
    });
  }

  getRawValue(): UserScopeProperty {
    const result = super.getRawValue();
    if (result.key == null || result.key === '') {
      delete result.key;
    }
    if (result.group_type == null || result.group_type === '') {
      delete result.group_type;
    }
    return result;
  }
}

export class UserScopePropertyFormArray extends TypedFormArray<
  UserScopeProperty,
  UserScopePropertyFormGroup[]
> {
  constructor(scopes: UserScopeProperty[]) {
    super(scopes.map((scope) => new UserScopePropertyFormGroup(scope)));
  }

  push(control?: UserScopePropertyFormGroup) {
    super.push(control ?? new UserScopePropertyFormGroup());
  }
}

export class UserScopeFormGroup extends TypedFormGroup<
  UserScope,
  {
    key: TypedFormControl<string>;
    title: TypedFormControl<string>;
    protected: TypedFormControl<boolean>;
    properties: UserScopePropertyFormArray;
  }
> {
  constructor(scope?: UserScope) {
    super({
      key: new TypedFormControl(scope?.key ?? '', [Validators.required]),
      title: new TypedFormControl(scope?.title ?? '', [Validators.required]),
      protected: new TypedFormControl(scope?.protected ?? false),
      properties: new UserScopePropertyFormArray(scope?.properties ?? []),
    });
    this.controls.protected.disable();
    if (scope?.protected) {
      this.controls.key.disable();
    }
  }
}

export class UserScopeFormArray extends TypedFormArray<
  UserScope,
  UserScopeFormGroup[]
> {
  constructor(scopes: UserScope[]) {
    super(scopes.map((scope) => new UserScopeFormGroup(scope)));
  }

  push(control?: UserScopeFormGroup) {
    super.push(control ?? new UserScopeFormGroup());
  }
}

export class GroupTypeFormGroup extends TypedFormGroup<
  GroupType,
  {
    key: TypedFormControl<string>;
    title: TypedFormControl<string>;
  }
> {
  constructor(groupType?: GroupType) {
    super({
      key: new TypedFormControl(groupType?.key ?? '', [Validators.required]),
      title: new TypedFormControl(groupType?.title ?? '', [
        Validators.required,
      ]),
    });
  }
}

export class GroupTypeFormArray extends TypedFormArray<
  GroupType,
  GroupTypeFormGroup[]
> {
  constructor(groupTypes: GroupType[]) {
    super(groupTypes.map((groupType) => new GroupTypeFormGroup(groupType)));
  }

  push(control?: GroupTypeFormGroup) {
    super.push(control ?? new GroupTypeFormGroup());
  }
}

export class SchemaForm extends TypedFormGroup<
  ApiManagerSchema,
  {
    user_properties: SchemaUserPropertyFormArray;
    scopes: UserScopeFormArray;
    group_types: GroupTypeFormArray;
  }
> {
  constructor(schema: ApiManagerSchema) {
    super({
      user_properties: new SchemaUserPropertyFormArray(schema.user_properties),
      scopes: new UserScopeFormArray(schema.scopes),
      group_types: new GroupTypeFormArray(schema.group_types),
    });
  }
}
