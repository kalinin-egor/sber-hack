// Типы для авторизации на основе OpenAPI схем

export interface UserRegisterSchema {
  email: string;
  username: string;
  password: string;
}

export interface UserLoginSchema {
  email: string;
  password: string;
}

export interface ConfirmRegisterSchema {
  temp_token: string;
  confirmation_code: string;
}

export interface ResponseSchema<T = any> {
  exception: number | null;
  data: T | null;
  message: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  is_verified: boolean;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: UserProfile;
}

export interface RegisterResponse {
  temp_token: string;
  message: string;
}

export interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// Дополнительные типы для ошибок API
export interface ApiError {
  detail: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errors?: ValidationError[];
}
