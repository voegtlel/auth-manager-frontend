import { Injectable } from '@angular/core';

export interface EnvInfo {
  apiUrl?: string;
  oicdIssuer?: string;
  oicdClientId?: string;
}

export function getEnv(): EnvInfo {
  const browserWindow = window || {};
  const browserWindowEnv = browserWindow['__env'] || {};
  return browserWindowEnv;
}

export function getApiUrl(): string {
  const env = getEnv();
  return env.apiUrl || '/manager';
}

@Injectable({
  providedIn: 'root',
})
export class EnvService {
  private _env: EnvInfo;

  public get apiUrl(): string {
    return this._env.apiUrl || '/manager';
  }

  public get oicdIssuer(): string {
    return this._env.oicdIssuer || 'http://127.0.0.1:8000';
  }

  public get oicdClientId(): string {
    return this._env.oicdClientId || 'manager';
  }

  constructor() {
    this._env = getEnv();
  }
}
