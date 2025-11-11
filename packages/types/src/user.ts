export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  organization?: string;
  api_key: string;
  api_key_hash: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  organization?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: Omit<User, 'password_hash' | 'api_key_hash'>;
}
