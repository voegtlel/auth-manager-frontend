import { Component, AfterViewInit } from '@angular/core';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements AfterViewInit {
  constructor(private auth: AuthService) {}

  ngAfterViewInit() {
    this.auth.logout();
  }
}
