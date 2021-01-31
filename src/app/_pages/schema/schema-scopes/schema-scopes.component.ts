import { Component, Input } from '@angular/core';
import {
  GroupTypeFormArray,
  SchemaUserPropertyFormArray,
  UserScopeFormArray,
} from 'src/app/_forms/schema-form';

@Component({
  selector: 'app-schema-scopes',
  templateUrl: './schema-scopes.component.html',
  styleUrls: ['./schema-scopes.component.scss'],
})
export class SchemaScopesComponent {
  @Input() scopes: UserScopeFormArray;
  @Input() group_types: GroupTypeFormArray;
  @Input() user_properties: SchemaUserPropertyFormArray;
}
