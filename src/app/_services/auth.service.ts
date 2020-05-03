import { Observable, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { EnvService } from './env.service';
import {
  OAuthService,
  OAuthErrorEvent,
  OAuthSuccessEvent,
} from 'angular-oauth2-oidc';
import { filter, map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';

export interface User {
  sub: string;
  given_name: string;
  familty_name: string;
  roles: string[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _loggedIn$ = new BehaviorSubject<boolean>(null);
  public readonly loggedIn$: Observable<
    boolean
  > = this._loggedIn$.asObservable();
  private readonly _user$ = new BehaviorSubject<User>(null);
  public readonly user$: Observable<User> = this._user$.asObservable();
  public readonly isAdmin$: Observable<boolean> = this.user$.pipe(
    map((user) => user && user.roles.includes('admin'))
  );
  private readonly _lastError$ = new BehaviorSubject<string>(null);
  public readonly lastError$: Observable<
    string
  > = this._lastError$.asObservable();

  private readonly _discoveryDocument$ = new BehaviorSubject<
    Record<string, any>
  >(null);
  public readonly discoveryDocument$ = this._discoveryDocument$.asObservable();

  public get isAdmin(): boolean {
    return this._user$.value?.roles.includes('admin');
  }

  public readonly userId$: Observable<string> = this.user$.pipe(
    map((user) => user?.sub)
  );
  public get userId(): string {
    return this._user$.value?.sub;
  }

  constructor(
    private oauthService: OAuthService,
    env: EnvService,
    private router: Router,
    toastr: NbToastrService
  ) {
    this.oauthService.configure({
      // Url of the Identity Provider
      issuer: env.oicdIssuer,

      // URL of the SPA to redirect the user to after login
      // redirectUri: window.location.origin,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,

      requireHttps: window.location.origin.startsWith('https'),

      // The SPA's id. The SPA is registerd with this id at the auth-server
      clientId: env.oicdClientId,

      // Just needed if your auth server demands a secret. In general, this
      // is a sign that the auth server is not configured with SPAs in mind
      // and it might not enforce further best practices vital for security
      // such applications.
      // dummyClientSecret: 'secret',

      responseType: 'code',

      // set the scope for the permissions the client should request
      // The first four are defined by OIDC.
      // Important: Request offline_access to get a refresh token
      // The api scope is a usecase specific one
      scope: 'openid profile email offline_access',

      showDebugInformation: true,

      useSilentRefresh: true,
      sessionChecksEnabled: true,
    });

    this.oauthService.events.subscribe((e) => console.log('Auth:', e));

    this.oauthService.events
      .pipe(
        filter((event) => event.type === 'discovery_document_loaded'),
        map(
          (discoveryEvent: OAuthSuccessEvent) =>
            discoveryEvent.info?.discoveryDocument
        )
      )
      .subscribe(this._discoveryDocument$);

    this.oauthService.events
      .pipe(
        filter(
          (e) => e.type === 'session_terminated' || e.type === 'token_received'
        ),
        map((e) => e.type === 'token_received')
      )
      .subscribe((loggedIn) => {
        if (this._lastError$.value !== null) {
          this._lastError$.next(null);
        }
        this._loggedIn$.next(loggedIn);
      });

    this.oauthService.events
      .pipe(
        filter((e) => e.type === 'code_error'),
        map(
          (e: OAuthErrorEvent) =>
            (e.params as any)?.error_description ??
            (e.params as any)?.error ??
            e.reason.toString()
        )
      )
      .subscribe((error: string) => {
        toastr.danger(error, 'Authentication Error');
        this._lastError$.next(error);
      });

    // Automatically load user profile
    this.oauthService.events
      .pipe(filter((e) => e.type === 'token_received'))
      .subscribe(() => this.oauthService.loadUserProfile());
    this.oauthService.events
      .pipe(
        filter((e) => e.type === 'user_profile_loaded'),
        map(() => this.oauthService.getIdentityClaims() as User)
      )
      .subscribe(this._user$);
    if (this.oauthService.hasValidIdToken()) {
      this._loggedIn$.next(true);
      const identityClaims = this.oauthService.getIdentityClaims();
      if (identityClaims) {
        this._user$.next(identityClaims as User);
      } else {
        this.oauthService.loadUserProfile();
      }
    }

    this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.oauthService.setupAutomaticSilentRefresh();
  }

  logout() {
    if (this.oauthService.hasValidIdToken()) {
      this.oauthService.revokeTokenAndLogout();
    } else {
      this.oauthService.revokeTokenAndLogout();
      this.router.navigateByUrl('/');
    }
  }

  login() {
    this.oauthService.initLoginFlow();
  }

  isSelf(userId: string): boolean {
    return this.userId === userId;
  }
}
