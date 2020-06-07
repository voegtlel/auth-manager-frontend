import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import {
  NbAccordionModule,
  NbActionsModule,
  NbAlertModule,
  NbBaseCalendarModule,
  NbButtonModule,
  NbCalendarKitModule,
  NbCalendarModule,
  NbCalendarRangeModule,
  NbCardModule,
  NbChatModule,
  NbCheckboxModule,
  NbContextMenuModule,
  NbDatepickerModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbMenuModule,
  NbPopoverModule,
  NbProgressBarModule,
  NbRadioModule,
  NbRouteTabsetModule,
  NbSearchModule,
  NbSelectModule,
  NbSidebarModule,
  NbSpinnerModule,
  NbStepperModule,
  NbTabsetModule,
  NbThemeModule,
  NbToastrModule,
  NbTooltipModule,
  NbTreeGridModule,
  NbUserModule,
  NbWindowModule,
  NbSidebarService,
  NbFormFieldModule,
} from '@nebular/theme';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfileComponent } from './_pages/profile/profile.component';
import { APP_BASE_HREF } from '@angular/common';
import { AuthenticationComponent } from './_pages/authentication/authentication.component';
import { getApiUrl } from './_services/env.service';
import { LogoutComponent } from './_pages/logout/logout.component';
import { AuthGuard } from './_services/auth-guard';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ImageCropperModule } from 'ngx-image-cropper';
import { FieldEditorComponent } from './_pages/profile/field-editor/field-editor.component';
import { PictureEditorComponent } from './_pages/profile/picture-editor/picture-editor.component';
import { SetPasswordComponent } from './_pages/profile/set-password/set-password.component';
import { SetEmailComponent } from './_pages/profile/set-email/set-email.component';
import { UsersComponent } from './_pages/users/users.component';
import { VerifyEmailComponent } from './_pages/verify-email/verify-email.component';
import { ResetPasswordComponent } from './_pages/reset-password/reset-password.component';
import { RegisteredComponent } from './_pages/profile/registered/registered.component';
import { MemberGroupsComponent } from './_components/member-groups/member-groups.component';
import { TableComponent } from './_components/table/table.component';
import { GroupsComponent } from './_pages/groups/groups.component';
import { GroupComponent } from './_pages/group/group.component';
import { MemberUsersComponent } from './_components/member-users/member-users.component';
import { ClientsComponent } from './_pages/clients/clients.component';
import { ClientComponent } from './_pages/client/client.component';
import { MemberGroupsAccessComponent } from './_components/member-groups-access/member-groups-access.component';
import { MemberUsersAccessComponent } from './_components/member-users-access/member-users-access.component';
import { MemberGroupsOptionsComponent } from './_components/member-groups-options/member-groups-options.component';
import { StringListEditComponent } from './_components/string-list-edit/string-list-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent,
    AuthenticationComponent,
    LogoutComponent,
    FieldEditorComponent,
    PictureEditorComponent,
    SetPasswordComponent,
    SetEmailComponent,
    UsersComponent,
    VerifyEmailComponent,
    ResetPasswordComponent,
    RegisteredComponent,
    MemberGroupsComponent,
    MemberGroupsAccessComponent,
    MemberGroupsOptionsComponent,
    MemberUsersComponent,
    MemberUsersAccessComponent,
    TableComponent,
    GroupsComponent,
    GroupComponent,
    ClientsComponent,
    ClientComponent,
    StringListEditComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    OAuthModule.forRoot({
      resourceServer: {
        customUrlValidation: (url) => url.startsWith(getApiUrl()),
        sendAccessToken: true,
      },
    }),
    NbSidebarModule,
    HttpClientModule,
    NbThemeModule.forRoot(),
    NbMenuModule.forRoot(),
    NbToastrModule.forRoot(),
    NbDialogModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbActionsModule,
    NbCardModule,
    NbLayoutModule,
    NbRouteTabsetModule,
    NbSearchModule,
    NbSidebarModule,
    NbTabsetModule,
    NbUserModule,
    NbCheckboxModule,
    NbPopoverModule,
    NbContextMenuModule,
    NbProgressBarModule,
    NbCalendarModule,
    NbCalendarRangeModule,
    NbStepperModule,
    NbButtonModule,
    NbInputModule,
    NbAccordionModule,
    NbWindowModule,
    NbListModule,
    NbAlertModule,
    NbSpinnerModule,
    NbRadioModule,
    NbSelectModule,
    NbChatModule,
    NbTooltipModule,
    NbCalendarKitModule,
    NbEvaIconsModule,
    NbBaseCalendarModule,
    NbIconModule,
    NbTreeGridModule,
    NbFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    ImageCropperModule,
    NgxFileDropModule,
  ],
  providers: [
    { provide: OAuthStorage, useValue: localStorage },
    NbSidebarService,
    { provide: APP_BASE_HREF, useValue: '/' },
    AuthGuard,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
