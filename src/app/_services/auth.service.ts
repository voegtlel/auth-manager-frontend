import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import {
  OAuthErrorEvent,
  OAuthService,
  OAuthSuccessEvent,
  ValidationParams,
} from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EnvService } from './env.service';

export interface User {
  sub: string;
  given_name: string;
  family_name: string;
  roles: string[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _loggedIn$ = new BehaviorSubject<boolean>(null);
  public readonly loggedIn$: Observable<boolean> =
    this._loggedIn$.asObservable();
  private readonly _user$ = new BehaviorSubject<User>(null);
  public readonly user$: Observable<User> = this._user$.asObservable();
  public readonly isAdmin$: Observable<boolean> = this.user$.pipe(
    map((user) => user && user.roles.includes('admin'))
  );
  private readonly _lastError$ = new BehaviorSubject<string>(null);
  public readonly lastError$: Observable<string> =
    this._lastError$.asObservable();

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
      silentRefreshRedirectUri:
        window.location.origin + '/assets/silent-refresh.html',

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
        if (!loggedIn) {
          router.navigate(['/']);
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

  generatePassword(length?: number): string {
    if (!window.crypto?.getRandomValues) {
      return;
    }
    if (length == null) {
      length = 24;
    }

    const b64 =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678901=';
    const randomData = new Uint8Array(length);
    window.crypto.getRandomValues(randomData);
    let result = '';
    let a: number;
    let b: number;
    let c: number;
    let bits: number;
    let i = 0;
    while (i < randomData.length) {
      a = randomData[i++];
      b = randomData[i++];
      c = randomData[i++];
      // @ts-ignore
      bits = (a << 16) | (b << 8) | c;
      // @ts-ignore
      result +=
        b64.charAt((bits >> 18) & 63) +
        b64.charAt((bits >> 12) & 63) +
        b64.charAt((bits >> 6) & 63) +
        b64.charAt(bits & 63);
    }
    return result;
  }

  protected padBase64(base64data: string): string {
    while (base64data.length % 4 !== 0) {
      base64data += '=';
    }
    return base64data;
  }

  protected b64DecodeUnicode(str: string): string {
    return decodeURIComponent(
      atob(str.replace(/\-/g, '+').replace(/\_/g, '/'))
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  }

  async validateUpdateToken(updateToken: string): Promise<Record<string, any>> {
    const tokenParts = updateToken.split('.');
    const headerBase64 = this.padBase64(tokenParts[0]);
    const headerJson = this.b64DecodeUnicode(headerBase64);
    const header = JSON.parse(headerJson);
    const claimsBase64 = this.padBase64(tokenParts[1]);
    const claimsJson = this.b64DecodeUnicode(claimsBase64);
    const claims = JSON.parse(claimsJson);

    const now = Date.now();
    const issuedAtMSec = claims.iat * 1000;
    const expiresAtMSec = claims.exp * 1000;
    const clockSkewInMSec = 600 * 1000;

    if (
      issuedAtMSec - clockSkewInMSec >= now ||
      expiresAtMSec + clockSkewInMSec <= now
    ) {
      const err = 'Token has expired';
      console.error(err);
      throw new Error(err);
    }

    const validationParams: ValidationParams = {
      idToken: updateToken,
      idTokenHeader: header,
      jwks: this.oauthService.jwks,
      accessToken: null,
      idTokenClaims: null,
      loadKeys: null,
    };

    await this.oauthService.tokenValidationHandler.validateSignature(
      validationParams
    );

    return claims;
  }
}
