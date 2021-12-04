import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.scss'],
})
export class AuthenticationComponent {
  loggedIn$: Observable<boolean>;
  name$: Observable<string>;
  lastError$: Observable<string>;
  returnUrl?: string = undefined;

  constructor(private auth: AuthService, route: ActivatedRoute) {
    this.loggedIn$ = auth.loggedIn$;
    this.lastError$ = auth.lastError$;
    this.name$ = auth.user$
      .pipe(filter((user) => !!user))
      .pipe(map((user) => user.given_name));

    route.queryParams
      .pipe(map((params) => params.returnUrl))
      .subscribe((returnUrl) => (this.returnUrl = returnUrl));
  }

  logout() {
    this.auth.logout();
  }

  login() {
    this.auth.login(this.returnUrl);
  }
}
