import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './_pages/profile/profile.component';
import { AuthGuard } from './_services/auth-guard';
import { AuthenticationComponent } from './_pages/authentication/authentication.component';
import { LogoutComponent } from './_pages/logout/logout.component';
import { UsersComponent } from './_pages/users/users.component';
import { VerifyEmailComponent } from './_pages/verify-email/verify-email.component';
import { ResetPasswordComponent } from './_pages/reset-password/reset-password.component';
import { RegisteredComponent } from './_pages/profile/registered/registered.component';
import { GroupsComponent } from './_pages/groups/groups.component';
import { GroupComponent } from './_pages/group/group.component';
import { ClientsComponent } from './_pages/clients/clients.component';
import { ClientComponent } from './_pages/client/client.component';

const routes: Routes = [
  {
    path: '',
    component: AuthenticationComponent,
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'registered',
    component: RegisteredComponent,
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: UsersComponent,
      },
      {
        path: ':userId',
        component: ProfileComponent,
      },
    ],
  },
  {
    path: 'groups',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: GroupsComponent,
      },
      {
        path: ':groupId',
        component: GroupComponent,
      },
    ],
  },
  {
    path: 'clients',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ClientsComponent,
      },
      {
        path: ':clientId',
        component: ClientComponent,
      },
    ],
  },
  {
    path: 'verify-email/:token',
    component: VerifyEmailComponent,
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
  },
  {
    path: 'register/:registrationToken',
    component: ProfileComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
