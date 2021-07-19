import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './_services/auth.service';
import { filter, map, takeUntil } from 'rxjs/operators';
import { NbMenuItem, NbSidebarService, NbMenuService } from '@nebular/theme';
import { Router, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  destroyed$: Subject<void> = new Subject();
  loggedIn$: Observable<boolean>;
  name$: Observable<string>;

  menuItems: NbMenuItem[] = [];

  menuItemsUser: NbMenuItem[] = [
    {
      title: 'Home',
      link: '/',
      home: true,
      icon: 'home',
    },
    {
      title: 'Profile',
      link: '/profile',
      icon: 'person',
    },
    {
      title: 'Log Out',
      link: '/logout',
      icon: 'log-out',
    },
  ];

  menuItemsAdmin: NbMenuItem[] = [
    {
      title: 'Home',
      link: '/',
      home: true,
      icon: 'home',
    },
    {
      title: 'Profile',
      link: '/profile',
      icon: 'person',
    },
    {
      title: 'Users',
      link: '/users',
      pathMatch: 'prefix',
      icon: 'person',
    },
    {
      title: 'Groups',
      link: '/groups',
      pathMatch: 'prefix',
      icon: 'people',
    },
    {
      title: 'Clients',
      link: '/clients',
      pathMatch: 'prefix',
      icon: 'bulb',
    },
    {
      title: 'Schema',
      link: '/schema',
      pathMatch: 'prefix',
      icon: 'code-outline',
    },
    {
      title: 'Log Out',
      link: '/logout',
      icon: 'log-out',
    },
  ];

  fixSelectMenuItem(url: string) {
    this.menuItems.forEach((menuItem) => {
      menuItem.selected = menuItem.link === url;
    });
  }

  constructor(
    private auth: AuthService,
    public sidebarService: NbSidebarService,
    public menuService: NbMenuService,
    public router: Router
  ) {
    this.loggedIn$ = auth.loggedIn$;
    this.name$ = auth.user$.pipe(
      filter((user) => !!user),
      map((user) => user.given_name)
    );
    auth.user$.pipe(takeUntil(this.destroyed$)).subscribe((user) => {
      if (user) {
        if (user.roles.includes('admin')) {
          this.menuItems = this.menuItemsAdmin;
        } else {
          this.menuItems = this.menuItemsUser;
        }
      }
    });
    this.loggedIn$.pipe(takeUntil(this.destroyed$)).subscribe((loggedIn) => {
      if (loggedIn) {
        sidebarService.expand('left');
      } else {
        sidebarService.collapse('left');
      }
    });

    // Fix menu hightlighting
    router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .pipe(takeUntil(this.destroyed$))
      .subscribe((event: NavigationStart) => {
        this.fixSelectMenuItem(event.url);
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  get backDisabled(): boolean {
    return false;
  }

  back() {
    console.log('Back');
  }

  logout() {
    this.auth.logout();
  }

  login() {
    this.auth.login();
  }
}
