export interface ClientInList {
  id: string;
}

export interface ClientAccessGroup {
  group: string;
  roles: string[];
}

export interface Client {
  id: string;
  notes: string;
  redirect_uri: string[];
  allowed_scope: string[];
  client_secret?: string;
  token_endpoint_auth_method: string[];
  response_type: string[];
  grant_type: string[];
  access_groups: ClientAccessGroup[];
}
