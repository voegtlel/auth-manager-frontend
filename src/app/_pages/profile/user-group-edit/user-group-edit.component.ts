import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { UserPropertyWithValue, UserViewDataGroup } from 'src/app/_models/user';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-user-group-edit',
  templateUrl: './user-group-edit.component.html',
  styleUrls: ['./user-group-edit.component.scss'],
})
export class UserGroupEditComponent implements OnChanges {
  @Input() userId: string;
  @Input() isActive: boolean;
  @Input() propertyGroup: UserViewDataGroup;

  @Output() valueChange = new EventEmitter<{
    property: UserPropertyWithValue;
    value: any;
  }>();
  @Output() validChange = new EventEmitter<{
    property: UserPropertyWithValue;
    valid: boolean;
  }>();

  groupProperty: UserPropertyWithValue;

  get canEdit(): boolean {
    return (
      ((this.groupProperty.can_edit === 'self' &&
        (this.isSelf || this.isAdmin)) ||
        (this.groupProperty.can_edit === 'only_self' && this.isSelf) ||
        (this.groupProperty.can_edit === 'admin' && this.isAdmin) ||
        this.groupProperty.can_edit === 'everybody') &&
      !this.groupProperty.write_once
    );
  }

  get isSelf(): boolean {
    return this.authService.isSelf(this.userId);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  additionalGroupProperties: UserPropertyWithValue[] = [];

  constructor(private authService: AuthService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.propertyGroup) {
      if (this.propertyGroup?.properties.length > 0) {
        this.groupProperty = this.propertyGroup.properties[0];
        this.additionalGroupProperties = this.propertyGroup.properties.slice(1);
      } else {
        this.groupProperty = null;
        this.additionalGroupProperties = [];
      }
    }
  }
}
