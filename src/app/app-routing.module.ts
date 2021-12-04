import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './_pages/authentication/authentication.component';
import { ClientComponent } from './_pages/client/client.component';
import { ClientsComponent } from './_pages/clients/clients.component';
import { GroupComponent } from './_pages/group/group.component';
import { GroupsComponent } from './_pages/groups/groups.component';
import { LogoutComponent } from './_pages/logout/logout.component';
import { ProfileComponent } from './_pages/profile/profile.component';
import { RegisteredComponent } from './_pages/profile/registered/registered.component';
import { ResetPasswordComponent } from './_pages/reset-password/reset-password.component';
import { SchemaComponent } from './_pages/schema/schema.component';
import { UpdateUserTokenComponent } from './_pages/update-user-token/update-user-token.component';
import { UsersComponent } from './_pages/users/users.component';
import { VerifyEmailComponent } from './_pages/verify-email/verify-email.component';
import { AuthGuard } from './_services/auth-guard';

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
    path: 'schema',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: SchemaComponent,
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
  {
    canActivate: [AuthGuard],
    path: 'profile/update/:token',
    component: UpdateUserTokenComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
