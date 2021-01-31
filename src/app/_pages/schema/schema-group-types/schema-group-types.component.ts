import { Component, Input } from '@angular/core';
import { GroupTypeFormArray } from 'src/app/_forms/schema-form';

@Component({
  selector: 'app-schema-group-types',
  templateUrl: './schema-group-types.component.html',
  styleUrls: ['./schema-group-types.component.scss'],
})
export class SchemaGroupTypesComponent {
  @Input() group_types: GroupTypeFormArray;
}
