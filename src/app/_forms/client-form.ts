import {
  AbstractControl,
  AbstractControlOptions,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Client, ClientAccessGroup } from '../_models/client';
import { GroupInList } from '../_models/group';
import {
  TypedFormArray,
  TypedFormControl,
  TypedFormGroup,
} from './typed-forms';
import { MemberGroupFormControl } from './user-group-form';

export class RolesFormArray extends TypedFormArray<
  string,
  TypedFormControl<string>[]
> {
  constructor(roles: string[]) {
    super(roles.map((role) => new TypedFormControl(role)));
  }

  setValueByCommaSeparatedString(value: string) {
    const values = value.split(',');
    while (this.controls.length < values.length) {
      this.push(new TypedFormControl(values[this.controls.length]));
    }
    while (this.controls.length > values.length) {
      this.removeAt(this.controls.length - 1);
    }
    for (let i = 0; i < this.controls.length; i++) {
      this.controls[i].setValue(values[i]);
    }
    this.markAsDirty();
    this.updateValueAndValidity();
  }
}

export class ClientAccessGroupFormGroup extends TypedFormGroup<
  ClientAccessGroup,
  {
    group: MemberGroupFormControl;
    roles: RolesFormArray;
  }
> {
  get group_id(): string {
    return this.controls.group.value;
  }

  constructor(
    groupsById$: Observable<Record<string, GroupInList>>,
    clientAccessGroup: ClientAccessGroup
  ) {
    super({
      group: new MemberGroupFormControl(
        groupsById$,
        clientAccessGroup?.group ?? null
      ),
      roles: new RolesFormArray(clientAccessGroup?.roles ?? []),
    });
  }
}

export class ClientAccessGroupsFormArray extends TypedFormArray<
  ClientAccessGroup,
  ClientAccessGroupFormGroup[]
> {
  constructor(
    private groupsById$: Observable<Record<string, GroupInList>>,
    clientAccessGroups: ClientAccessGroup[]
  ) {
    super(
      clientAccessGroups.map(
        (clientAccessGroup) =>
          new ClientAccessGroupFormGroup(groupsById$, clientAccessGroup)
      )
    );
  }

  add(groupId: string) {
    super.push(
      new ClientAccessGroupFormGroup(this.groupsById$, {
        group: groupId,
        roles: [],
      })
    );
  }
}

const requiredGrantMap: Record<string, string[]> = {
  code: ['authorization_code'],
  token: [],
  id_token: ['implicit'],
  ['code token']: ['authorization_code', 'implicit'],
  ['code id_token']: ['authorization_code', 'implicit'],
  ['token id_token']: ['implicit'],
  ['code token id_token']: ['authorization_code', 'implicit'],
};

export class ClientGroupForm extends TypedFormGroup<
  Client,
  {
    id: TypedFormControl<string>;
    notes: TypedFormControl<string>;
    redirect_uri: TypedFormArray<string, TypedFormControl<string>[]>;
    allowed_scope: TypedFormControl<string[]>;
    client_secret: TypedFormControl<string>;
    token_endpoint_auth_method: TypedFormControl<string[]>;
    response_type: TypedFormControl<string[]>;
    grant_type: TypedFormControl<string[]>;
    access_groups: ClientAccessGroupsFormArray;
  }
> {
  constructor(
    groupsById$: Observable<Record<string, GroupInList>>,
    client?: Client,
    validateFormId?
  ) {
    super({
      id: new TypedFormControl(
        client?.id ?? '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.+-]+$/)],
        validateFormId
      ),
      notes: new TypedFormControl(client?.notes ?? ''),
      redirect_uri: new TypedFormArray(
        (client?.redirect_uri ?? []).map((uri) => new TypedFormControl(uri))
      ),
      allowed_scope: new TypedFormControl(client?.allowed_scope ?? []),
      client_secret: new TypedFormControl(client?.client_secret ?? ''),
      token_endpoint_auth_method: new TypedFormControl(
        client?.token_endpoint_auth_method ?? []
      ),
      response_type: new TypedFormControl(client?.response_type ?? []),
      grant_type: new TypedFormControl(
        client?.grant_type ?? [],
        ClientGroupForm._validateGrantTypes
      ),
      access_groups: new ClientAccessGroupsFormArray(
        groupsById$,
        client?.access_groups ?? []
      ),
    });
  }

  private static _validateGrantTypes = (
    control: AbstractControl
  ): ValidationErrors => {
    const grantTypes = new Set<string>(control.value ?? []);
    const missingTypes = new Set<string>();
    const responseTypes: string[] = (control.parent as ClientGroupForm)
      ?.controls.response_type.value;
    if (!responseTypes) {
      return;
    }
    for (const responseType of responseTypes) {
      requiredGrantMap[responseType]
        .filter((requiredType) => !grantTypes.has(requiredType))
        .forEach((missingType) => missingTypes.add(missingType));
    }
    if (missingTypes.size > 0) {
      return {
        missingTypes: [...missingTypes].join(', '),
      };
    }
    return null;
  };
}
