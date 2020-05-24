import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { UserViewData, UsersListViewData } from '../_models/user';
import { EnvService } from './env.service';
import { Group, GroupWithId, GroupInList } from '../_models/user_group';
import { Client, ClientInList } from '../_models/client';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, private env: EnvService) {}

  uploadPicture(
    sub: string,
    body: Blob,
    registrationToken?: string
  ): Observable<void> {
    const formData = new FormData();
    formData.append('file', body);
    const headers = {};
    if (registrationToken != null) {
      headers['X-Token'] = registrationToken;
    }
    return this.http.post<void>(`${this.env.apiUrl}/picture/${sub}`, formData, {
      headers,
    });
  }

  getUsers(): Observable<UsersListViewData> {
    return this.http.get<UsersListViewData>(`${this.env.apiUrl}/users`);
  }

  getCreateUser(): Observable<UserViewData> {
    return this.http.get<UserViewData>(`${this.env.apiUrl}/users/new`);
  }

  createUser(updates: object, noRegistration?: boolean): Observable<void> {
    let query = '';
    if (noRegistration) {
      query = '?no_registration=true';
    }
    return this.http.post<void>(`${this.env.apiUrl}/users${query}`, updates);
  }

  updateUser(userId: string, updates: object): Observable<void> {
    return this.http.patch<void>(`${this.env.apiUrl}/users/${userId}`, updates);
  }

  getUser(userId: string): Observable<UserViewData> {
    return this.http.get<UserViewData>(`${this.env.apiUrl}/users/${userId}`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.env.apiUrl}/users/${userId}`);
  }

  reverifyEmail(userId: string): Observable<void> {
    return this.http.post<void>(
      `${this.env.apiUrl}/users/${userId}/reverify-email`,
      null
    );
  }

  resendRegistration(userId: string): Observable<void> {
    return this.http.post<void>(
      `${this.env.apiUrl}/users/${userId}/resend-registration`,
      null
    );
  }

  getUserRegistration(registrationToken: string): Observable<UserViewData> {
    return this.http.get<UserViewData>(`${this.env.apiUrl}/register`, {
      headers: {
        'X-Token': registrationToken,
      },
    });
  }

  registerUser(registrationToken: string, userData: object): Observable<void> {
    return this.http.put<void>(`${this.env.apiUrl}/register`, userData, {
      headers: {
        'X-Token': registrationToken,
      },
    });
  }

  verifyEmail(verifyToken: string): Observable<void> {
    return this.http.put<void>(`${this.env.apiUrl}/verify-email`, null, {
      headers: {
        'X-Token': verifyToken,
      },
    });
  }

  requestResetUserPassword(userId: string): Observable<void> {
    return this.http.post<void>(
      `${this.env.apiUrl}/users/${userId}/reset-password`,
      null
    );
  }

  resetPassword(resetToken: string, newPassword: string): Observable<void> {
    return this.http.put<void>(
      `${this.env.apiUrl}/reset-password`,
      { password: newPassword },
      {
        headers: {
          'X-Token': resetToken,
        },
      }
    );
  }

  createGroup(data: GroupWithId): Observable<void> {
    return this.http.post<void>(`${this.env.apiUrl}/groups`, data);
  }

  getGroups(): Observable<GroupInList[]> {
    return this.http.get<GroupInList[]>(`${this.env.apiUrl}/groups`);
  }

  getGroup(groupId: string): Observable<GroupWithId> {
    return this.http.get<GroupWithId>(`${this.env.apiUrl}/groups/${groupId}`);
  }

  updateGroup(groupId: string, data: Group): Observable<void> {
    return this.http.put<void>(`${this.env.apiUrl}/groups/${groupId}`, data);
  }

  deleteGroup(groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.env.apiUrl}/groups/${groupId}`);
  }

  createClient(data: Client): Observable<void> {
    return this.http.post<void>(`${this.env.apiUrl}/clients`, data);
  }

  getClients(): Observable<ClientInList[]> {
    return this.http.get<ClientInList[]>(`${this.env.apiUrl}/clients`);
  }

  getClient(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${this.env.apiUrl}/clients/${clientId}`);
  }

  updateClient(clientId: string, data: Client): Observable<void> {
    return this.http.put<void>(`${this.env.apiUrl}/clients/${clientId}`, data);
  }

  deleteClient(clientId: string): Observable<void> {
    return this.http.delete<void>(`${this.env.apiUrl}/clients/${clientId}`);
  }
}
