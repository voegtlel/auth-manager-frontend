import { Component } from '@angular/core';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  templateUrl: './registered.component.html',
  styleUrls: ['./registered.component.scss'],
})
export class RegisteredComponent {
  constructor(private auth: AuthService) {}

  login() {
    this.auth.login();
  }
}
