import { Component, Input } from '@angular/core';
import { SchemaUserPropertyFormArray } from 'src/app/_forms/schema-form';

@Component({
  selector: 'app-schema-user-properties',
  templateUrl: './schema-user-properties.component.html',
  styleUrls: ['./schema-user-properties.component.scss'],
})
export class SchemaUserPropertiesComponent {
  @Input() user_properties: SchemaUserPropertyFormArray;
}
