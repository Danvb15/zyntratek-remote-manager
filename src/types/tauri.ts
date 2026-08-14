export interface TauriResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
