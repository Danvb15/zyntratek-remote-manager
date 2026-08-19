export interface Snippet {
  id: string;
  name: string;
  command: string;
  category: string;
  description?: string;
  createdAt: string;
}

export interface CreateSnippetPayload {
  name: string;
  command: string;
  category?: string;
  description?: string;
}

export interface UpdateSnippetPayload {
  name?: string;
  command?: string;
  category?: string;
  description?: string;
}
