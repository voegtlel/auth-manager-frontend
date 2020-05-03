import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter, map } from 'rxjs/operators';
import { AuthService } from 'src/app/_services/auth.service';
import { Observable } from 'rxjs';

@Component({
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.scss'],
})
export class AuthenticationComponent {
  loggedIn$: Observable<boolean>;
  name$: Observable<string>;
  lastError$: Observable<string>;

  constructor(private auth: AuthService) {
    this.loggedIn$ = auth.loggedIn$;
    this.lastError$ = auth.lastError$;
    this.name$ = auth.user$
      .pipe(filter((user) => !!user))
      .pipe(map((user) => user.given_name));
  }

  logout() {
    this.auth.logout();
  }

  login() {
    this.auth.login();
  }
}
