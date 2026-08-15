export type Protocol = 'SSH' | 'RDP' | 'WEB' | 'VNC';





export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Connection {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  credentialId?: string;
  folderId?: string;
  favorite: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionPayload {
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  credentialId?: string;
  folderId?: string;
  favorite?: boolean;
  tagIds?: string[];
}

export interface UpdateConnectionPayload {
  name?: string;
  protocol?: Protocol;
  host?: string;
  port?: number;
  username?: string;
  credentialId?: string;
  folderId?: string;
  favorite?: boolean;
  tagIds?: string[];
}
